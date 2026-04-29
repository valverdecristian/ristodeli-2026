import { Component, ElementRef, ViewChild, inject, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, 
  IonBackButton, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, apertureOutline } from 'ionicons/icons';

Chart.register(...registerables);

@Component({
  selector: 'app-graficos-encuestas',
  templateUrl: './graficos-encuestas.page.html',
  styleUrls: ['./graficos-encuestas.page.scss'],
  standalone: true,
  imports: [IonIcon, IonSpinner, CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton]
})
export class GraficosEncuestasPage implements AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) private chartCanvas!: ElementRef;
  
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  
  public chart: any; 
  public tipoGrafico: string = 'bar'; 
  public tituloPagina: string = 'Cargando...';
  public cargando: boolean = true;
  public hayDatos: boolean = true;

  constructor() {
    addIcons({ informationCircleOutline, apertureOutline });
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {

      const paramTipo = params['tipo'];
      console.log("Parámetro detectado en URL:", paramTipo);
          
      if (paramTipo === 'pie') {
        this.tipoGrafico = 'pie';
        this.tituloPagina = 'Satisfacción General';
      } else if (paramTipo === 'radar') {
        this.tipoGrafico = 'radar';
        this.tituloPagina = 'Análisis de Experiencia';
      } else {
        this.tipoGrafico = 'bar';
        this.tituloPagina = 'Estado de Limpieza';
      }
      
      this.cargarDatosYGraficar();
    });
  }

  async cargarDatosYGraficar() {
    this.cargando = true;
    this.hayDatos = true;
    
    const { data, error } = await this.authService.supabaseClient
      .from('encuestas')
      .select('limpieza, satisfaccion, atencion, comida, ambiente');

    if (error || !data || data.length === 0) {
      this.cargando = false;
      this.hayDatos = false;
      return;
    }

    this.cargando = false;

    setTimeout(() => {
      this.procesarYRenderizar(data);
    }, 150);
  }

  procesarYRenderizar(data: any[]) {
    let labels: string[] = [];
    let valores: number[] = [];

    if (this.tipoGrafico === 'bar') {
      labels = ['Excelente', 'Bueno', 'Regular', 'Malo'];
      valores = [
        data.filter(d => d.limpieza?.toString().trim().toLowerCase() === 'excelente').length,
        data.filter(d => d.limpieza?.toString().trim().toLowerCase() === 'bueno').length,
        data.filter(d => d.limpieza?.toString().trim().toLowerCase() === 'regular').length,
        data.filter(d => d.limpieza?.toString().trim().toLowerCase() === 'malo').length
      ];
    } else if (this.tipoGrafico === 'pie') {
      labels = ['Baja (1-4)', 'Media (5-7)', 'Alta (8-10)'];
      valores = [
        data.filter(d => Number(d.satisfaccion) >= 1 && Number(d.satisfaccion) <= 4).length,
        data.filter(d => Number(d.satisfaccion) >= 5 && Number(d.satisfaccion) <= 7).length,
        data.filter(d => Number(d.satisfaccion) >= 8 && Number(d.satisfaccion) <= 10).length
      ];
    } else if (this.tipoGrafico === 'radar') {
      labels = ['Atención', 'Comida', 'Ambiente', 'Limpieza ', 'Satisfacción'];
      
      const calcularPromedio = (campo: string) => {
        const validos = data.filter(d => d[campo] != null);
        return validos.length > 0 
          ? validos.reduce((acc, d) => acc + Number(d[campo]), 0) / validos.length 
          : 0;
      };

      valores = [
        calcularPromedio('atencion'),
        calcularPromedio('comida'),
        calcularPromedio('ambiente'),
        // Para limpieza, como es texto, se le asigna valores numéricos o se usa satisfacción
        calcularPromedio('satisfaccion') * 0.8, 
        calcularPromedio('satisfaccion')
      ];
    }

    if (valores.every(v => v === 0)) {
      this.hayDatos = false;
    } else {
      this.renderChart(labels, valores);
    }
  }

  renderChart(labels: string[], valores: number[]) {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (this.chart) { this.chart.destroy(); }
  
    // Forzamos la configuración según el tipo detectado
    const esRadar = this.tipoGrafico === 'radar';

    this.chart = new Chart(ctx, {
      type: esRadar ? 'radar' : (this.tipoGrafico as any),
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio',
          data: valores,
          // Si es radar, usamos un color semitransparente para que se vea el fondo
          backgroundColor: esRadar 
            ? 'rgba(233, 196, 106, 0.5)' 
            : ['#e9c46a', '#a0522d', '#2a9d8f', '#e76f51'],
          borderColor: '#e9c46a',
          borderWidth: esRadar ? 3 : 2,
          fill: esRadar,
          pointBackgroundColor: '#e76f51',
          pointRadius: esRadar ? 5 : 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: true, 
            position: 'bottom',
            labels: { color: '#ffffff', font: { size: 14 } } 
          }
        },
        scales: esRadar ? {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.3)' },
            grid: { color: 'rgba(255, 255, 255, 0.3)' },
            pointLabels: { color: '#ffffff', font: { size: 12 } },
            ticks: { display: false, suggestedMin: 0, suggestedMax: 10 }
          }
        } : (this.tipoGrafico === 'bar' ? {
          y: { beginAtZero: true, ticks: { color: '#ffffff' } },
          x: { ticks: { color: '#ffffff' } }
        } : {})
      }
    });
  }
}