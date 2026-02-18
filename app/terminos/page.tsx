import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Términos y condiciones · Gold Legacy",
  description:
    "Términos y condiciones de uso de la tienda en línea Gold Legacy. Condiciones de compra, envíos y garantías."
};

export default function TerminosPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        title="Términos y condiciones"
        description="Última actualización: febrero 2025. Al usar Gold Legacy aceptas estos términos."
      />

      <div className="prose prose-invert prose-sm max-w-3xl space-y-6 text-muted">
        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">1. Objeto y aceptación</h2>
          <p>
            Los presentes Términos y Condiciones regulan el uso de la tienda en línea Gold Legacy
            (en adelante, «la Tienda»). Al realizar una compra o utilizar nuestros servicios, el
            usuario acepta íntegramente estos términos. Si no estás de acuerdo, te pedimos que no
            utilices la Tienda.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">2. Productos y precios</h2>
          <p>
            Los productos ofrecidos son joyería en oro y accesorios. Los precios se muestran en
            pesos colombianos (COP) e incluyen IVA cuando aplique. Nos reservamos el derecho de
            modificar precios y de limitar cantidades. En caso de error en precio o disponibilidad,
            nos pondremos en contacto para ofrecerte una alternativa o la devolución del importe.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">3. Pedidos y confirmación</h2>
          <p>
            Al confirmar un pedido, recibirás un correo de confirmación con el número de orden y el
            resumen de tu compra. La aceptación del pedido está sujeta a disponibilidad de stock.
            Nos reservamos el derecho de rechazar pedidos en caso de indicios de fraude o de
            incumplimiento de estas condiciones.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">4. Formas de pago</h2>
          <p>
            Las formas de pago disponibles se indican en el proceso de compra. El pago podrá
            realizarse según los métodos habilitados (tarjeta, transferencia, etc.). La orden se
            procesará una vez confirmado el pago según nuestros criterios operativos.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">5. Envíos y entrega</h2>
          <p>
            Los plazos y costes de envío se informan antes de finalizar la compra. Gold Legacy
            realiza envíos a la dirección indicada por el cliente. Es responsabilidad del cliente
            facilitar datos correctos. En caso de ausencia o dirección incorrecta, los costes
            derivados podrán ser asumidos por el cliente.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">6. Devoluciones y garantías</h2>
          <p>
            La joyería Gold Legacy está elaborada con materiales de calidad. Ante defectos de
            fabricación, podrás ejercer tu derecho a reparación, sustitución o devolución según la
            normativa aplicable. Para devoluciones por cambio de opinión, consulta nuestra
            política de devoluciones o contáctanos. Algunos productos pueden tener condiciones
            específicas por higiene o personalización.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">7. Propiedad intelectual</h2>
          <p>
            Todo el contenido de la Tienda (textos, imágenes, logotipos, diseños) es propiedad de
            Gold Legacy o de sus licenciantes. Queda prohibida su reproducción o uso no autorizado.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">8. Contacto</h2>
          <p>
            Para cualquier cuestión relacionada con estos términos o con tu pedido, puedes
            contactarnos a través del correo o los canales indicados en la web.
          </p>
        </section>
      </div>
    </div>
  );
}
