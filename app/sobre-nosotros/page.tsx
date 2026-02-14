import { SectionTitle } from "@/components/ui/SectionTitle";

export default function AboutPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        eyebrow="Tradición familiar hecha joya"
        title="Un manifiesto de lujo silencioso."
        description="Gold Legacy nace de una obsesión compartida, crear piezas en oro que se sientan impecables en el presente y sigan teniendo sentido dentro de veinte años."
      />

      <div className="grid md:grid-cols-2 gap-10 text-sm text-muted">
        <div className="space-y-4">
          <p>
            Creemos que el verdadero lujo no grita, susurra. No se trata de
            logotipos visibles ni de excesos, sino de proporciones exactas, peso
            equilibrado y brillo controlado. Cada joya que sale de nuestro taller
            ha pasado por un proceso riguroso de selección de materiales y
            revisión manual.
          </p>
          <p>
            Trabajamos exclusivamente con oro certificado y proveedores
            auditados. Esto nos permite garantizar no solo la calidad del metal,
            sino también un proceso responsable y trazable.
          </p>
        </div>
        <div className="space-y-4">
          <p>
            Diseñamos con la filosofía del minimalismo cálido: líneas limpias,
            volúmenes puros y detalles sutiles que solo se perciben de cerca.
            Queremos que cada pieza Gold Legacy pueda acompañar tanto un look
            diario como un momento memorable.
          </p>
          <p>
            Nuestro objetivo es que, al sostener una pieza Gold Legacy en tus
            manos, sientas que estás invirtiendo en algo que trasciende las
            tendencias: un legado personal en forma de oro.
          </p>
        </div>
      </div>
    </div>
  );
}

