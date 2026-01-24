import Head from 'next/head';
import { useState, useEffect } from 'react';

export default function Perrito() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= sectionTop - 200) {
          current = section.getAttribute('id');
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const target = document.querySelector(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>Investigación: Soplos Cardíacos en Perros de 13 Años | pixan.ai</title>
        <meta name="description" content="Investigación completa sobre soplos cardíacos en perros de 13 años, incluyendo probabilidades de vida, diagnóstico científico y veterinarios especialistas en CDMX. Realizada con pensamiento extendido por pixan.ai" />
        <meta name="keywords" content="soplos cardíacos perros, veterinarios CDMX, cardiología veterinaria, enfermedad valvular mitral, ecocardiografía perros" />
        <meta name="author" content="pixan.ai" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://pixan.ai/perrito" />
        <meta property="og:title" content="Investigación: Soplos Cardíacos en Perros de 13 Años" />
        <meta property="og:description" content="Guía completa sobre soplos cardíacos en perros mayores, con información científica y especialistas en CDMX" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Investigación: Soplos Cardíacos en Perros de 13 Años" />
        <meta property="twitter:description" content="Guía completa sobre soplos cardíacos en perros mayores" />

        {/* Theme Color */}
        <meta name="theme-color" content="#2C5F7C" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </Head>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
          --primary: #2C5F7C;
          --secondary: #16A085;
          --accent: #E8F4F8;
          --text: #1d1d1d;
          --text-light: #4A5568;
          --bg: #ffffff;
          --border: #CBD5E0;
          --warning: #F59E0B;
          --danger: #EF4444;
          --success: #10B981;

          /* Safe area insets for mobile devices */
          --safe-area-inset-top: env(safe-area-inset-top);
          --safe-area-inset-bottom: env(safe-area-inset-bottom);
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: var(--text);
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Header */
        header {
          background: linear-gradient(135deg, var(--primary) 0%, #1a4459 100%);
          color: white;
          padding: 2rem 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
          padding-top: calc(2rem + var(--safe-area-inset-top));
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-icon {
          font-size: 3rem;
          animation: pulse 2s infinite;
          flex-shrink: 0;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .header-text h1 {
          font-size: clamp(1.5rem, 5vw, 2.5rem);
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          line-height: 1.2;
        }

        .header-text p {
          font-size: clamp(1rem, 3vw, 1.2rem);
          opacity: 0.9;
        }

        .pixan-brand {
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          transition: all 0.3s;
        }

        .pixan-brand:hover {
          transform: translateY(-2px);
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        /* Navigation */
        nav {
          background: white;
          padding: 0.75rem 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: sticky;
          top: calc(140px + var(--safe-area-inset-top));
          z-index: 90;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        nav ul {
          list-style: none;
          display: flex;
          justify-content: center;
          flex-wrap: nowrap;
          gap: 0.5rem;
          min-width: min-content;
          padding: 0 0.5rem;
        }

        nav li {
          flex-shrink: 0;
        }

        nav a {
          display: inline-block;
          padding: 0.75rem 1.25rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s;
          white-space: nowrap;
          font-size: clamp(0.85rem, 2vw, 1rem);
        }

        nav a:hover,
        nav a.active {
          background: var(--accent);
          transform: translateY(-2px);
        }

        /* Main Content */
        main {
          padding: 2rem 0;
          padding-bottom: calc(2rem + var(--safe-area-inset-bottom));
        }

        section {
          background: white;
          border-radius: 12px;
          padding: 2rem 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.07);
          animation: fadeIn 0.6s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        h2 {
          color: var(--primary);
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 700;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 3px solid var(--secondary);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        h3 {
          color: var(--secondary);
          font-size: clamp(1.25rem, 3.5vw, 1.5rem);
          font-weight: 700;
          margin: 2rem 0 1rem;
        }

        h4 {
          color: var(--primary);
          font-size: clamp(1.1rem, 3vw, 1.2rem);
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
        }

        /* Cards */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1.25rem;
          margin: 1.5rem 0;
        }

        .card {
          background: var(--accent);
          border-left: 4px solid var(--secondary);
          padding: 1.5rem;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        .card-title {
          color: var(--primary);
          font-weight: 700;
          font-size: clamp(1rem, 2.5vw, 1.1rem);
          margin-bottom: 0.75rem;
        }

        .card-content {
          color: var(--text-light);
          font-size: clamp(0.9rem, 2vw, 0.95rem);
          line-height: 1.6;
        }

        .card-content p {
          margin: 0.5rem 0;
        }

        .card-content ul {
          margin-left: 1.25rem;
        }

        /* Alert Boxes */
        .alert {
          padding: 1.25rem;
          border-radius: 8px;
          margin: 1.5rem 0;
          border-left: 4px solid;
          font-weight: 500;
          font-size: clamp(0.9rem, 2vw, 1rem);
        }

        .alert-warning {
          background: #FEF3C7;
          border-color: var(--warning);
          color: #92400E;
        }

        .alert-danger {
          background: #FEE2E2;
          border-color: var(--danger);
          color: #7F1D1D;
        }

        .alert-success {
          background: #D1FAE5;
          border-color: var(--success);
          color: #065F46;
        }

        .alert-info {
          background: #DBEAFE;
          border-color: #3B82F6;
          color: #1E3A8A;
        }

        /* Tables */
        .table-container {
          overflow-x: auto;
          margin: 1.5rem 0;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          min-width: 600px;
        }

        th {
          background: var(--primary);
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: clamp(0.85rem, 2vw, 1rem);
          position: sticky;
          top: 0;
        }

        td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          font-size: clamp(0.85rem, 2vw, 0.95rem);
        }

        tr:hover {
          background: var(--accent);
        }

        /* Lists */
        ul, ol {
          margin: 1rem 0 1rem 1.5rem;
        }

        li {
          margin: 0.5rem 0;
          color: var(--text-light);
          line-height: 1.6;
        }

        strong {
          color: var(--primary);
          font-weight: 700;
        }

        /* Veterinarian Cards */
        .vet-card {
          background: linear-gradient(135deg, #ffffff 0%, var(--accent) 100%);
          border: 2px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem 0;
          transition: all 0.3s;
        }

        .vet-card:hover {
          border-color: var(--secondary);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          transform: translateX(4px);
        }

        .vet-name {
          color: var(--primary);
          font-size: clamp(1.1rem, 3vw, 1.3rem);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .vet-info {
          color: var(--text-light);
          margin: 0.25rem 0;
          font-size: clamp(0.9rem, 2vw, 0.95rem);
          line-height: 1.5;
        }

        .vet-contact {
          display: inline-block;
          background: var(--secondary);
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          margin-top: 0.75rem;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          font-size: clamp(0.9rem, 2vw, 1rem);
        }

        .vet-contact:hover {
          background: #138C73;
          transform: scale(1.05);
        }

        /* Footer */
        footer {
          background: var(--primary);
          color: white;
          text-align: center;
          padding: 2rem;
          margin-top: 3rem;
          padding-bottom: calc(2rem + var(--safe-area-inset-bottom));
        }

        footer p {
          font-size: clamp(0.85rem, 2vw, 1rem);
          line-height: 1.6;
        }

        /* Scroll behavior */
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 200px;
        }

        /* Icon styles */
        .emoji {
          font-style: normal;
          font-size: 1.5em;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          header {
            padding: 1.5rem 0;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          nav {
            top: calc(120px + var(--safe-area-inset-top));
          }

          nav::-webkit-scrollbar {
            height: 4px;
          }

          nav::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
          }

          section {
            padding: 1.5rem 1rem;
            border-radius: 8px;
          }

          .card-grid {
            grid-template-columns: 1fr;
          }

          .table-container {
            margin: 1rem -1rem;
          }

          html {
            scroll-padding-top: 180px;
          }
        }

        /* Print styles */
        @media print {
          header, nav, footer {
            background: white !important;
            color: black !important;
            position: static !important;
          }

          section {
            page-break-inside: avoid;
            box-shadow: none;
          }

          .vet-contact {
            background: transparent !important;
            color: black !important;
            border: 1px solid black;
          }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Focus styles for keyboard navigation */
        a:focus,
        button:focus {
          outline: 3px solid var(--secondary);
          outline-offset: 2px;
        }
      `}</style>

      <header>
        <div className="container">
          <div className="header-content">
            <div className="header-icon" role="img" aria-label="Perro">🐕</div>
            <div className="header-text">
              <h1>Investigación con Pensamiento Extendido</h1>
              <p>Soplos Cardíacos en Perros de 13 Años</p>
              <p style={{ marginTop: '0.5rem' }}>
                Investigación realizada por{' '}
                <a href="/" className="pixan-brand">pixan.ai</a>
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav role="navigation" aria-label="Navegación principal">
        <div className="container">
          <ul>
            <li><a href="#probabilidades" onClick={(e) => scrollToSection(e, '#probabilidades')} className={activeSection === 'probabilidades' ? 'active' : ''}>📊 Probabilidades de Vida</a></li>
            <li><a href="#diagnostico" onClick={(e) => scrollToSection(e, '#diagnostico')} className={activeSection === 'diagnostico' ? 'active' : ''}>🔬 Diagnóstico Científico</a></li>
            <li><a href="#veterinarios" onClick={(e) => scrollToSection(e, '#veterinarios')} className={activeSection === 'veterinarios' ? 'active' : ''}>🏥 Especialistas CDMX</a></li>
            <li><a href="#implicaciones" onClick={(e) => scrollToSection(e, '#implicaciones')} className={activeSection === 'implicaciones' ? 'active' : ''}>🩺 Implicaciones</a></li>
          </ul>
        </div>
      </nav>

      <main className="container">
        {/* Sección de Probabilidades */}
        <section id="probabilidades">
          <h2><span className="emoji" role="img" aria-label="Gráfico">📊</span> PROBABILIDADES DE VIDA / PRONÓSTICO</h2>

          <div className="alert alert-info">
            <strong>📌 Punto Clave:</strong> El pronóstico varía <strong>significativamente</strong> según la causa subyacente y la etapa de detección.
          </div>

          <h3>Soplos Fisiológicos (Benignos)</h3>
          <div className="card">
            <div className="card-title">✅ Pronóstico Excelente</div>
            <div className="card-content">
              <p><strong>Esperanza de vida:</strong> Normal, sin impacto</p>
              <p><strong>Características:</strong> Común en perros jóvenes adultos. Pueden desaparecer con el tiempo.</p>
              <p><strong>Tratamiento:</strong> Generalmente no requiere intervención</p>
            </div>
          </div>

          <h3>Enfermedad Valvular Mitral (EVC/MMVD)</h3>
          <p><em>La causa más común en perros mayores - Clasificación según ACVIM:</em></p>

          <div className="card-grid">
            <div className="card">
              <div className="card-title">Estadio B1</div>
              <div className="card-content">
                <p><strong>Descripción:</strong> Soplo presente, sin dilatación cardíaca</p>
                <p><strong>Pronóstico:</strong> Pueden pasar varios años antes de progresar</p>
                <p><strong>Esperanza:</strong> Algunos perros tienen esperanza de vida normal</p>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Estadio B2</div>
              <div className="card-content">
                <p><strong>Descripción:</strong> Soplo con dilatación cardíaca detectada</p>
                <p><strong>Progresión:</strong> ~50% desarrollan ICC en 2-2.5 años</p>
                <p><strong>Con tratamiento:</strong> Retrasa síntomas <strong>15 meses promedio</strong> (pimobendan)</p>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Estadio C ⚠️</div>
              <div className="card-content">
                <p><strong>Descripción:</strong> Insuficiencia cardíaca congestiva</p>
                <p><strong>Esperanza de vida:</strong> <strong>6-14 meses</strong> con tratamiento</p>
                <p><strong>Requiere:</strong> Manejo médico intensivo</p>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Estadio D 🚨</div>
              <div className="card-content">
                <p><strong>Descripción:</strong> Enfermedad terminal</p>
                <p><strong>Mediana:</strong> <strong>9 meses</strong></p>
                <p><strong>Rango:</strong> 3 meses a 2+ años</p>
              </div>
            </div>
          </div>

          <h3>Cardiomiopatía Dilatada</h3>
          <div className="alert alert-warning">
            <strong>⚠️ Común en razas grandes (Doberman, Gran Danés)</strong><br />
            Pronóstico reservado: <strong>6-24 meses</strong> tras diagnóstico<br />
            Con signos de insuficiencia cardíaca: pronóstico <strong>desfavorable</strong>
          </div>

          <h3>Factores que Influyen en el Pronóstico</h3>
          <ul>
            <li><strong>Grado del soplo</strong> (I-VI): A mayor grado, generalmente peor pronóstico</li>
            <li><strong>Edad de detección</strong>: Detección temprana mejora opciones</li>
            <li><strong>Raza y tamaño</strong>: Diferentes predisposiciones genéticas</li>
            <li><strong>Presencia de síntomas</strong>: Perros asintomáticos tienen mejor pronóstico</li>
            <li><strong>Adherencia al tratamiento</strong>: Crucial para la supervivencia</li>
          </ul>
        </section>

        {/* Sección de Diagnóstico */}
        <section id="diagnostico">
          <h2><span className="emoji" role="img" aria-label="Microscopio">🔬</span> DIAGNÓSTICO CIENTÍFICO DEL SOPLO CARDÍACO</h2>

          <h3>1. Auscultación Inicial</h3>
          <p><strong>Método:</strong> Estetoscopio - Primera herramienta diagnóstica</p>

          <h4>Clasificación del Soplo por Intensidad</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Grado</th>
                  <th>Intensidad</th>
                  <th>Descripción Clínica</th>
                  <th>Significado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>I</strong></td>
                  <td>Muy leve</td>
                  <td>Apenas audible, difícil de detectar</td>
                  <td>Generalmente benigno</td>
                </tr>
                <tr>
                  <td><strong>II</strong></td>
                  <td>Débil</td>
                  <td>Claramente audible pero débil</td>
                  <td>Puede ser fisiológico</td>
                </tr>
                <tr>
                  <td><strong>III</strong></td>
                  <td>Moderado</td>
                  <td>Fácilmente audible, sin frémito</td>
                  <td>Problemas serios suelen ser ≥ Grado III</td>
                </tr>
                <tr>
                  <td><strong>IV</strong></td>
                  <td>Intenso</td>
                  <td>Fuerte, con frémito palpable</td>
                  <td>Patología significativa</td>
                </tr>
                <tr>
                  <td><strong>V</strong></td>
                  <td>Muy fuerte</td>
                  <td>Muy intenso con frémito evidente</td>
                  <td>Patología severa</td>
                </tr>
                <tr>
                  <td><strong>VI</strong></td>
                  <td>Máximo</td>
                  <td>Audible sin contacto completo del estetoscopio</td>
                  <td>Patología muy severa</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>Clasificación por Timing</h4>
          <div className="card-grid">
            <div className="card">
              <div className="card-title">Sistólico</div>
              <div className="card-content">Durante la contracción del corazón. El más común en perros.</div>
            </div>
            <div className="card">
              <div className="card-title">Diastólico</div>
              <div className="card-content">Durante la relajación del corazón. Menos frecuente, generalmente patológico.</div>
            </div>
            <div className="card">
              <div className="card-title">Continuo</div>
              <div className="card-content">Durante todo el ciclo cardíaco. Puede indicar condiciones específicas como DAP.</div>
            </div>
          </div>

          <h3>2. Estudios Diagnósticos Complementarios</h3>
          <div className="alert alert-danger">
            <strong>⚠️ IMPORTANTE:</strong> Un diagnóstico basado <strong>SOLO en auscultación</strong> (sin radiografía ni ecocardiografía) es <strong>INCOMPLETO</strong>. La literatura científica es clara: se requiere <strong>ecocardiografía</strong> para determinar la causa específica y el estadio de la enfermedad.
          </div>

          <h4>Radiografía Torácica</h4>
          <div className="card">
            <div className="card-title">📸 Utilidad Diagnóstica</div>
            <div className="card-content">
              <ul>
                <li><strong>Evalúa tamaño cardíaco:</strong> Detecta cardiomegalia</li>
                <li><strong>Congestión pulmonar:</strong> Identifica edema pulmonar</li>
                <li><strong>Mediciones objetivas:</strong></li>
                <ul>
                  <li><strong>VHS</strong> (Vertebral Heart Size): &gt;10.5-11.7 indica dilatación</li>
                  <li><strong>VLAS</strong> (Vertebral Left Atrial Size): &gt;3.0 indica agrandamiento auricular izquierdo</li>
                </ul>
              </ul>
            </div>
          </div>

          <h4>Ecocardiografía Doppler - GOLD STANDARD ⭐</h4>
          <div className="alert alert-success">
            <strong>🏆 El método más confiable para diagnóstico definitivo</strong><br />
            La ecocardiografía Doppler es considerada el estándar de oro en cardiología veterinaria.
          </div>

          <div className="card">
            <div className="card-title">Capacidades de la Ecocardiografía</div>
            <div className="card-content">
              <ul>
                <li><strong>Visualización en tiempo real:</strong> Estructuras cardíacas, válvulas, paredes</li>
                <li><strong>Evaluación de flujos:</strong> Detecta flujos anómalos y regurgitaciones</li>
                <li><strong>Medición de presiones:</strong> Presiones intracardiacas y gradientes</li>
                <li><strong>Mediciones clave:</strong></li>
                <ul>
                  <li><strong>LA:Ao</strong> (Ratio aurícula izquierda/aorta): Anormal si ≥1.6</li>
                  <li><strong>LVIDDN</strong> (Diámetro ventricular izquierdo normalizado): Anormal si ≥1.7</li>
                  <li><strong>Fracción de eyección:</strong> Evaluación de función sistólica</li>
                  <li><strong>Velocidad de flujos:</strong> Detección de estenosis o insuficiencias</li>
                </ul>
              </ul>
            </div>
          </div>

          <h4>Electrocardiograma (ECG)</h4>
          <div className="card">
            <div className="card-title">⚡ Evaluación Eléctrica</div>
            <div className="card-content">
              <ul>
                <li>Evalúa actividad eléctrica cardíaca</li>
                <li>Detecta arritmias (taquicardia, fibrilación, bloqueos)</li>
                <li>Valora frecuencia e intensidad cardíaca</li>
                <li>Complementa otros estudios diagnósticos</li>
              </ul>
            </div>
          </div>

          <h4>Biomarcadores Cardíacos</h4>
          <div className="card">
            <div className="card-title">🧪 Análisis de Laboratorio</div>
            <div className="card-content">
              <ul>
                <li><strong>NT-proBNP:</strong> Péptido natriurético cerebral - Indicador de insuficiencia cardíaca</li>
                <li><strong>Troponina I:</strong> Marcador de daño miocárdico</li>
                <li><strong>Utilidad:</strong> Monitorización, pronóstico, y seguimiento de tratamiento</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sección de Veterinarios */}
        <section id="veterinarios">
          <h2><span className="emoji" role="img" aria-label="Hospital">🏥</span> VETERINARIOS CARDIÓLOGOS ESPECIALISTAS EN CDMX</h2>

          <p style={{ marginBottom: '2rem' }}><em>Lista completa de especialistas en cardiología veterinaria en la Ciudad de México con sus datos de contacto actualizados:</em></p>

          <div className="vet-card">
            <div className="vet-name">1. Hospital Veterinario DELTA</div>
            <div className="vet-info"><strong>Especialista:</strong> MVZ Esp. MMVZ Alhelí Sierra Briseño</div>
            <div className="vet-info"><strong>Formación:</strong> Maestría en Cardiología Veterinaria</div>
            <div className="vet-info"><strong>Servicios:</strong> Ecocardiografía completa, monitoreo electrocardiográfico, medición de presión arterial, consulta especializada</div>
            <a href="tel:5555369137" className="vet-contact">📞 55 5536 9137</a>
          </div>

          <div className="vet-card">
            <div className="vet-name">2. Neurovet - Hospital de Especialidades</div>
            <div className="vet-info"><strong>Ubicación:</strong> Ángel Urraza 204, Col. Vértiz Narvarte, Benito Juárez, CDMX, CP 03600</div>
            <div className="vet-info"><strong>Especialidad:</strong> Cardiología veterinaria con tecnología de vanguardia</div>
            <div className="vet-info"><strong>Servicios:</strong> ECG, ecocardiografía, tratamiento de cardiomiopatías, enfermedad valvular, arritmias</div>
            <div className="vet-info"><strong>Equipamiento:</strong> Tecnología de última generación en diagnóstico cardíaco</div>
          </div>

          <div className="vet-card">
            <div className="vet-name">3. CardioCare</div>
            <div className="vet-info"><strong>Especialización:</strong> Hospital dedicado EXCLUSIVAMENTE a cardiología veterinaria</div>
            <div className="vet-info"><strong>Disponibilidad:</strong> Urgencias 24/7</div>
            <div className="vet-info"><strong>Servicios:</strong> Electrocardiografía, ecocardiografía avanzada, radiología digital, monitoreo Holter</div>
            <div className="vet-info"><strong>Sitio web:</strong> cardiocare.mx</div>
            <a href="https://cardiocare.mx" target="_blank" rel="noopener noreferrer" className="vet-contact">🌐 Visitar Sitio Web</a>
          </div>

          <div className="vet-card">
            <div className="vet-name">4. Hospital Veterinario WestCare</div>
            <div className="vet-info"><strong>Servicio:</strong> Cardiología con atención de emergencias 24 horas</div>
            <div className="vet-info"><strong>Horario WhatsApp:</strong> Lunes a Sábado, 10:00 AM - 7:00 PM</div>
            <div className="vet-info"><strong>Servicios:</strong> Consultas especializadas, estudios diagnósticos completos</div>
            <a href="https://wa.me/5525836326" target="_blank" rel="noopener noreferrer" className="vet-contact">💬 WhatsApp: 55 2583 6326</a>
          </div>

          <div className="vet-card">
            <div className="vet-name">5. VETME Hospital Veterinario 24 hrs</div>
            <div className="vet-info"><strong>Disponibilidad:</strong> 24 horas, 7 días a la semana</div>
            <div className="vet-info"><strong>Servicios completos:</strong> Radiología, electrocardiografía, ecocardiografía Doppler</div>
            <div className="vet-info"><strong>Especialidad:</strong> Diagnóstico y tratamiento integral de alteraciones cardiovasculares</div>
          </div>

          <div className="vet-card">
            <div className="vet-name">6. Cardiopet</div>
            <div className="vet-info"><strong>Ubicación:</strong> Alfonso Reyes #40, Colonia Condesa, CDMX</div>
            <div className="vet-info"><strong>Cardiólogo:</strong> Dr. Alan Castillo Andrew</div>
            <div className="vet-info"><strong>Servicios:</strong> Electrocardiograma especializado, ecocardiograma avanzado</div>
            <div className="vet-info"><strong>Nota:</strong> Tolerancia de 20 minutos para citas programadas</div>
          </div>

          <div className="vet-card">
            <div className="vet-name">7. Hospital Veterinario Animal Home</div>
            <div className="vet-info"><strong>Especialista:</strong> Dra. Alhelí Sierra</div>
            <div className="vet-info"><strong>Formación:</strong> Instituto de Cardiología</div>
            <div className="vet-info"><strong>Ventaja:</strong> Todos los estudios en un solo lugar (ECG, radiografías, ecocardiograma)</div>
            <div className="vet-info"><strong>Servicios:</strong> Diagnóstico integral y tratamiento especializado</div>
          </div>

          <div className="vet-card">
            <div className="vet-name">8. Centro Veterinario México</div>
            <div className="vet-info"><strong>Departamento:</strong> Cardiología y Neumología</div>
            <div className="vet-info"><strong>Equipo:</strong> Médicos con amplia preparación en cardiología veterinaria</div>
            <div className="vet-info"><strong>Enfoque:</strong> Atención especializada con equipamiento moderno</div>
          </div>

          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            <strong>💡 Recomendación:</strong> Antes de la consulta, prepara:<br />
            • Historial médico completo del perro<br />
            • Lista de medicamentos actuales<br />
            • Descripción detallada de síntomas observados<br />
            • Preguntas específicas para el especialista
          </div>
        </section>

        {/* Sección de Implicaciones */}
        <section id="implicaciones">
          <h2><span className="emoji" role="img" aria-label="Estetoscopio">🩺</span> IMPLICACIONES DE LA CONDICIÓN</h2>

          <h3>Impacto en Calidad de Vida</h3>

          <h4>Fase Asintomática (Estadios B1-B2)</h4>
          <div className="card">
            <div className="card-title">✅ Sin Síntomas Aparentes</div>
            <div className="card-content">
              <ul>
                <li><strong>Calidad de vida:</strong> El perro puede vivir normalmente durante años</li>
                <li><strong>Actividad:</strong> Mantiene su rutina habitual con leves restricciones</li>
                <li><strong>Síntomas:</strong> No hay signos evidentes para el propietario</li>
                <li><strong>Monitoreo:</strong> Requiere seguimiento periódico cada 3-6 meses</li>
                <li><strong>Ejercicio:</strong> Puede necesitar restricciones moderadas en actividad intensa</li>
              </ul>
            </div>
          </div>

          <h4>Fase Sintomática (Estadio C - Insuficiencia Cardíaca Congestiva)</h4>
          <div className="alert alert-warning">
            <strong>⚠️ Atención:</strong> Los síntomas de esta fase requieren intervención médica inmediata y manejo continuo.
          </div>

          <div className="card-grid">
            <div className="card">
              <div className="card-title">🫁 Síntomas Respiratorios</div>
              <div className="card-content">
                • Tos (especialmente nocturna)<br />
                • Dificultad respiratoria<br />
                • Jadeo excesivo<br />
                • Respiración rápida y superficial
              </div>
            </div>

            <div className="card">
              <div className="card-title">💪 Síntomas Físicos</div>
              <div className="card-content">
                • Intolerancia al ejercicio<br />
                • Debilidad generalizada<br />
                • Fatiga extrema<br />
                • Síncopes (desmayos)<br />
                • Pérdida de apetito
              </div>
            </div>

            <div className="card">
              <div className="card-title">🔍 Signos Avanzados</div>
              <div className="card-content">
                • Distensión abdominal (ascitis)<br />
                • Encías pálidas o azuladas<br />
                • Extremidades frías<br />
                • Inquietud nocturna<br />
                • Pérdida de peso
              </div>
            </div>
          </div>

          <h3>Tratamiento Requerido</h3>

          <h4>Medicamentos Comunes</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Función Principal</th>
                  <th>Dosis Típica</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pimobendan</strong> (Vetmedin)</td>
                  <td>Inotrópico positivo y vasodilatador</td>
                  <td>0.25-0.3 mg/kg cada 12h</td>
                  <td>Mejora función cardíaca, retrasa progresión</td>
                </tr>
                <tr>
                  <td><strong>IECA</strong> (Enalapril, Benazepril)</td>
                  <td>Vasodilatador, reduce postcarga</td>
                  <td>0.5 mg/kg cada 12-24h</td>
                  <td>Control de presión arterial</td>
                </tr>
                <tr>
                  <td><strong>Furosemida</strong></td>
                  <td>Diurético de asa</td>
                  <td>1-8 mg/kg/día (según fase)</td>
                  <td>Elimina exceso de líquido</td>
                </tr>
                <tr>
                  <td><strong>Espironolactona</strong></td>
                  <td>Diurético ahorrador de potasio</td>
                  <td>1-2 mg/kg cada 12-24h</td>
                  <td>Previene pérdida de potasio</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="alert alert-info">
            <strong>💊 Importante sobre medicamentos:</strong><br />
            • Todos los medicamentos deben ser prescritos por un veterinario especializado<br />
            • Las dosis varían según peso, estadio y respuesta individual<br />
            • NUNCA ajustar dosis sin consultar al veterinario<br />
            • Algunos medicamentos pueden interactuar entre sí
          </div>

          <h4>Manejo Integral</h4>
          <div className="card-grid">
            <div className="card">
              <div className="card-title">🍽️ Dieta</div>
              <div className="card-content">
                • Baja en sodio (reducir retención de líquidos)<br />
                • Alta en proteínas de calidad<br />
                • Suplementos omega-3<br />
                • Control estricto de porciones<br />
                • Agua fresca siempre disponible
              </div>
            </div>

            <div className="card">
              <div className="card-title">⚖️ Control de Peso</div>
              <div className="card-content">
                • Mantener peso ideal<br />
                • Evitar obesidad (sobrecarga cardíaca)<br />
                • Evitar desnutrición<br />
                • Pesaje regular (semanal)<br />
                • Ajustar dieta según necesidad
              </div>
            </div>

            <div className="card">
              <div className="card-title">🏃 Ejercicio</div>
              <div className="card-content">
                • Moderado y controlado<br />
                • Paseos cortos y frecuentes<br />
                • Evitar esfuerzo intenso<br />
                • Monitorear tolerancia<br />
                • Descansos frecuentes
              </div>
            </div>

            <div className="card">
              <div className="card-title">🔍 Monitoreo</div>
              <div className="card-content">
                • Ecocardiografías regulares (3-6 meses)<br />
                • Radiografías de seguimiento<br />
                • Análisis de sangre periódicos<br />
                • Medición de presión arterial<br />
                • Evaluación de biomarcadores
              </div>
            </div>
          </div>

          <h3>Aspectos Económicos</h3>
          <div className="alert alert-warning">
            <strong>💰 Consideraciones Financieras Importantes</strong>
          </div>

          <div className="card">
            <div className="card-title">Costos a Considerar</div>
            <div className="card-content">
              <ul>
                <li><strong>Medicación de por vida:</strong> $1,500 - $4,000 MXN mensuales (varía según medicamentos y dosis)</li>
                <li><strong>Ecocardiografías periódicas:</strong> $1,500 - $3,000 MXN cada 3-6 meses</li>
                <li><strong>Radiografías de seguimiento:</strong> $500 - $1,000 MXN por estudio</li>
                <li><strong>Consultas especializadas:</strong> $600 - $1,500 MXN por visita</li>
                <li><strong>Análisis de laboratorio:</strong> $800 - $2,000 MXN cada 3-6 meses</li>
                <li><strong>Posibles hospitalizaciones:</strong> $3,000 - $10,000 MXN por episodio</li>
                <li><strong>Dieta especializada:</strong> $800 - $1,500 MXN mensuales</li>
              </ul>
              <p style={{ marginTop: '1rem' }}><strong>Costo estimado anual:</strong> $30,000 - $80,000 MXN (dependiendo del estadio y complicaciones)</p>
            </div>
          </div>

          <div className="alert alert-success">
            <strong>💡 Tip económico:</strong> La detección temprana reduce significativamente los costos a largo plazo, ya que permite tratamiento menos agresivo y previene hospitalizaciones de emergencia.
          </div>

          <h3>Consideraciones Importantes para Tu Amiga</h3>

          <div className="alert alert-danger">
            <strong>🚨 URGENTE - Acción Inmediata Requerida</strong>
          </div>

          <div className="card-grid">
            <div className="card">
              <div className="card-title">1. Estudio Completo Necesario</div>
              <div className="card-content">
                Es URGENTE realizar un estudio completo:<br />
                • Radiografías torácicas<br />
                • Ecocardiografía Doppler<br />
                • ECG<br />
                • Análisis de sangre básico
              </div>
            </div>

            <div className="card">
              <div className="card-title">2. Objetivos del Estudio</div>
              <div className="card-content">
                • Determinar causa exacta del soplo<br />
                • Establecer estadio de la enfermedad<br />
                • Definir si requiere tratamiento inmediato<br />
                • Establecer pronóstico realista
              </div>
            </div>

            <div className="card">
              <div className="card-title">3. Contexto del Paciente</div>
              <div className="card-content">
                • A los 13 años, la causa más probable es enfermedad valvular mitral degenerativa<br />
                • El pronóstico depende COMPLETAMENTE del diagnóstico específico<br />
                • Sin estudios es IMPOSIBLE determinarlo con precisión
              </div>
            </div>

            <div className="card">
              <div className="card-title">4. Mensaje de Esperanza</div>
              <div className="card-content">
                • MUCHOS perros viven años con esta condición<br />
                • El diagnóstico temprano es CLAVE<br />
                • El tratamiento adecuado marca la diferencia<br />
                • NO todos los soplos son iguales
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ marginTop: '2rem' }}>
            <strong>📋 Antes de la consulta especializada, prepara:</strong><br /><br />
            1. <strong>Historial médico completo:</strong> Vacunas, desparasitaciones, cirugías previas<br />
            2. <strong>Lista de medicamentos actuales:</strong> Incluyendo suplementos<br />
            3. <strong>Descripción detallada de síntomas:</strong> Frecuencia, duración, intensidad<br />
            4. <strong>Video de síntomas:</strong> Si es posible, especialmente de tos o dificultad respiratoria<br />
            5. <strong>Preguntas escritas:</strong> Para no olvidar nada importante durante la consulta<br />
            6. <strong>Estudios previos:</strong> Si existen, llevar resultados de análisis o radiografías anteriores
          </div>

          <h3>Señales de Emergencia</h3>
          <div className="alert alert-danger">
            <strong>🚨 Buscar atención veterinaria INMEDIATA si observas:</strong><br /><br />
            • Dificultad respiratoria severa o respiración con la boca abierta en reposo<br />
            • Encías azuladas o muy pálidas<br />
            • Colapso o desmayo<br />
            • Tos con sangre<br />
            • Hinchazón abdominal rápida y progresiva<br />
            • Negativa total a comer o beber<br />
            • Inquietud extrema que no cesa<br />
            • Extremidades muy frías al tacto
          </div>
        </section>

        {/* Sección de Conclusión */}
        <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1a4459 100%)', color: 'white' }}>
          <h2 style={{ color: 'white', borderColor: 'white' }}>📋 RESUMEN Y RECOMENDACIÓN FINAL</h2>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', margin: '2rem 0' }}>
            <h3 style={{ color: 'white' }}>El Contexto</h3>
            <p>Tu amiga tiene un perro de <strong>13 años</strong> al que le detectaron un soplo cardíaco durante una consulta por un problema en su patita, aparentemente <strong>sin realizar radiografía ni estudios específicos</strong>, solo por auscultación.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', margin: '2rem 0' }}>
            <h3 style={{ color: 'white' }}>Lo Que Sabemos</h3>
            <ul style={{ color: 'white' }}>
              <li>El pronóstico varía dramáticamente según la causa subyacente y el estadio</li>
              <li>Puede ir desde esperanza de vida <strong>normal</strong> (soplos benignos) hasta <strong>6-14 meses</strong> (insuficiencia cardíaca congestiva)</li>
              <li>La detección fue incidental - el perro fue por otro motivo</li>
              <li>NO se hicieron estudios complementarios en ese momento</li>
            </ul>
          </div>

          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '2rem', borderRadius: '12px', margin: '2rem 0', borderLeft: '6px solid var(--warning)' }}>
            <h3 style={{ color: '#92400E' }}>🎯 Recomendación Principal</h3>
            <p style={{ fontSize: '1.2rem', fontWeight: '700' }}>Tu amiga debe acudir <strong>LO ANTES POSIBLE</strong> a un cardiólogo veterinario especializado para un estudio completo.</p>
            <p style={{ marginTop: '1rem' }}>El hecho de que solo se detectó por auscultación durante una consulta por otro problema es una <strong>SEÑAL DE ALERTA</strong> de que se necesita evaluación especializada inmediata.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '12px', margin: '2rem 0' }}>
            <h3 style={{ color: 'white' }}>Por Qué es Urgente</h3>
            <ol style={{ color: 'white', fontSize: '1.1rem' }}>
              <li><strong>Sin estudios = Sin diagnóstico real:</strong> La auscultación sola no es suficiente para saber qué tipo de problema cardíaco tiene</li>
              <li><strong>El tiempo importa:</strong> Si requiere tratamiento, empezarlo temprano puede añadir meses o años de vida</li>
              <li><strong>Puede ser algo menor:</strong> O puede requerir atención inmediata - no hay forma de saberlo sin estudios</li>
              <li><strong>Tranquilidad:</strong> Conocer el diagnóstico exacto permite tomar decisiones informadas</li>
            </ol>
          </div>

          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '2rem', borderRadius: '12px', margin: '2rem 0', borderLeft: '6px solid var(--success)' }}>
            <h3 style={{ color: '#065F46' }}>💚 Mensaje de Esperanza</h3>
            <p style={{ fontSize: '1.1rem' }}>Muchos perros con soplos cardíacos viven años con buena calidad de vida cuando se diagnostican y tratan adecuadamente. La clave es actuar ahora, no esperar a que aparezcan síntomas.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}><strong>Investigación realizada con pensamiento extendido por pixan.ai</strong></p>
          <p style={{ opacity: '0.9' }}>Información recopilada de fuentes científicas y veterinarias especializadas</p>
          <p style={{ opacity: '0.8', marginTop: '1rem', fontSize: '0.9rem' }}>Fecha de investigación: Enero 2024-2025</p>
          <p style={{ opacity: '0.7', marginTop: '0.5rem', fontSize: '0.85rem' }}>Esta información es solo con fines educativos. Siempre consulta con un veterinario especializado para el diagnóstico y tratamiento específico.</p>
        </div>
      </footer>
    </>
  );
}
