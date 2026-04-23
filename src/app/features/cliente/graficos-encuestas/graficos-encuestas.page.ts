import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner } from '@ionic/angular/standalone';

Chart.register(...registerables);

@Component({
  selector: 'app-graficos-encuestas',
  templateUrl: './graficos-encuestas.page.html',
  styleUrls: ['./graficos-encuestas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner]
})

export class GraficosEncuestasPage implements OnInit {
  @ViewChild('chartCanvas') private chartCanvas!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  public chart: any; 
  public tipoGrafico: string = 'bar';
  public cargando: boolean = true;

  ngOnInit() {
    this.tipoGrafico = this.route.snapshot.paramMap.get('tipo') || 'bar';
  }

  ionViewDidEnter() {
    this.cargarDatosYGraficar();
  }

  async cargarDatosYGraficar() {
    this.cargando = true;
    
    const { data, error } = await this.authService.supabaseClient
      .from('encuestas')
      .select('limpieza, satisfaccion');

    if (error) {
      console.error("Error cargando encuestas:", error);
      this.cargando = false;
      return;
    }

    let labels: string[] = [];
    let valores: number[] = [];

    if (this.tipoGrafico === 'bar') {
      const categorias = ['Excelente', 'Bueno', 'Regular', 'Malo'];
      labels = categorias;
      valores = categorias.map(cat => data.filter(d => d.limpieza === cat).length);
    } else {
      labels = ['Baja (1-4)', 'Media (5-7)', 'Alta (8-10)'];
      valores = [
        data.filter(d => d.satisfaccion <= 4).length,
        data.filter(d => d.satisfaccion >= 5 && d.satisfaccion <= 7).length,
        data.filter(d => d.satisfaccion >= 8).length
      ];
    }

    this.renderChart(labels, valores);
    this.cargando = false;
  }

  renderChart(labels: string[], valores: number[]) {
    const ctx = this.chartCanvas.nativeElement;
    
    if (this.chart) { 
      this.chart.destroy(); 
    }
  
    this.chart = new Chart(ctx, {
      type: this.tipoGrafico as any,
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad de Votos',
          data: valores,
          backgroundColor: [
            '#FFD700', 
            '#00FA9A', 
            '#00BFFF', 
            '#FF6347', 
            '#EE82EE'  
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
          borderRadius: this.tipoGrafico === 'bar' ? 8 : 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { 
              color: '#ffffff', 
              font: { size: 14, weight: 'bold' } 
            }
          }
        },
        scales: this.tipoGrafico === 'bar' ? {
          y: { 
            beginAtZero: true, 
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' } 
          },
          x: { 
            ticks: { color: '#ffffff' } 
          }
        } : {} 
      }
    });
  }
}