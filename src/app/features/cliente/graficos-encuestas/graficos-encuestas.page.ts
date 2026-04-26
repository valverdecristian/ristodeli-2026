import { Component, ElementRef, ViewChild, inject, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, statsChartOutline, pieChart, barChart } from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-graficos-encuestas',
  templateUrl: './graficos-encuestas.page.html',
  styleUrls: ['./graficos-encuestas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, 
    IonButtons, IonBackButton, IonSpinner
  ]
})
export class GraficosEncuestasPage implements AfterViewInit {
  // Aseguramos que el nombre coincida con el # del HTML (usamos canvasElement como en el diseño anterior)
  @ViewChild('canvasElement') private chartCanvas!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  public chart: any; 
  public tipoGrafico: string = 'bar';
  public cargando: boolean = true;
  public hayDatos: boolean = true;

  constructor() {
    // Registramos todos los íconos necesarios para evitar errores de URL inválida
    addIcons({ informationCircleOutline, statsChartOutline, pieChart, barChart });
  }

  // Usamos AfterViewInit para garantizar que el canvas esté disponible
  ngAfterViewInit() {
    // Obtenemos el tipo de gráfico de los parámetros de la URL
    const tipoRecibido = this.route.snapshot.paramMap.get('tipoGrafico');
    this.tipoGrafico = tipoRecibido === 'torta' ? 'pie' : 'bar';
    
    // Pequeño delay para asegurar el renderizado de la vista de Ionic
    setTimeout(() => {
      this.cargarDatosYGraficar();
    }, 400);
  }

  async cargarDatosYGraficar() {
    this.cargando = true;
    
    const { data, error } = await this.authService.supabaseClient
      .from('encuestas')
      .select('limpieza, satisfaccion');

    if (error || !data || data.length === 0) {
      console.error("Error o sin datos:", error);
      this.hayDatos = false;
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
    // Verificación de seguridad para evitar el error de nativeElement undefined
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) {
      console.error("No se encontró el canvas para graficar");
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
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
            '#e9c46a', // Saffron
            '#a0522d', // Russet
            '#2a9d8f', 
            '#e76f51', 
            '#264653'  
          ],
          borderColor: this.tipoGrafico === 'pie' ? '#ffffff' : 'transparent',
          borderWidth: 2
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
              color: '#333333', 
              font: { size: 12, weight: 'bold' } 
            }
          }
        }
      }
    });
  }
}