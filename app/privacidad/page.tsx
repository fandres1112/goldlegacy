import type { Metadata } from "next";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Política de privacidad · Gold Legacy",
  description:
    "Política de privacidad de Gold Legacy. Cómo tratamos tus datos personales, cookies y derechos."
};

export default function PrivacidadPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <SectionTitle
        title="Política de privacidad"
        description="En Gold Legacy nos comprometemos a proteger tu información personal. Esta política describe cómo recogemos, usamos y protegemos tus datos."
      />

      <div className="prose prose-invert prose-sm max-w-3xl space-y-6 text-muted">
        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales que nos facilitas es Gold Legacy
            (en adelante, «nosotros» o «la marca»), con la finalidad de gestionar la relación
            comercial, los pedidos y la comunicación con nuestros clientes.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">2. Datos que recogemos</h2>
          <p>
            Recogemos los datos que nos facilitas al registrarte, al realizar un pedido o al
            contactarnos: nombre, correo electrónico, teléfono, dirección de envío y, si aplica,
            datos de pago. También podemos recoger datos de uso del sitio (por ejemplo, tipo de
            dispositivo o páginas visitadas) para mejorar nuestra web y la experiencia de compra.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">3. Finalidad del tratamiento</h2>
          <p>
            Utilizamos tus datos para: procesar y enviar tus pedidos, gestionar tu cuenta de
            usuario (si la tienes), enviarte comunicaciones sobre tu compra o sobre la marca (con
            tu consentimiento cuando la ley lo exija), mejorar nuestros productos y servicios, y
            cumplir obligaciones legales.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">4. Base legal y conservación</h2>
          <p>
            El tratamiento se basa en la ejecución del contrato (gestión del pedido), en el
            consentimiento (newsletters, cookies no esenciales) o en el interés legítimo (seguridad,
            mejora del servicio). Conservamos los datos mientras sea necesario para estas finalidades
            y para cumplir obligaciones legales (por ejemplo, facturación).
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">5. Cookies y tecnologías similares</h2>
          <p>
            Utilizamos cookies y tecnologías similares para el correcto funcionamiento del sitio
            (por ejemplo, carrito de compra o preferencias de sesión). Puedes configurar tu
            navegador para limitar o bloquear cookies; ten en cuenta que algunas funciones del
            sitio podrían verse afectadas.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">6. Cesión de datos</h2>
          <p>
            No vendemos tus datos personales. Podemos compartir datos con proveedores necesarios
            para el servicio (envíos, pagos, hosting o email), que actúan bajo nuestras
            instrucciones y con las garantías adecuadas.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">7. Tus derechos</h2>
          <p>
            Tienes derecho a acceder, rectificar, suprimir tus datos, oponerte a ciertos
            tratamientos, limitar el tratamiento y, cuando aplique, a la portabilidad. Puedes
            ejercer estos derechos contactándonos. Si consideras que el tratamiento no se ajusta
            a la normativa, tienes derecho a presentar una reclamación ante la autoridad de
            protección de datos correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">8. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas para proteger tus datos frente a accesos no
            autorizados, pérdida o alteración. La comunicación con el sitio puede realizarse por
            conexión segura (HTTPS) cuando esté disponible.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">9. Cambios</h2>
          <p>
            Podemos actualizar esta política de privacidad. Los cambios relevantes se comunicarán
            mediante un aviso en la web o por correo cuando sea apropiado. Te recomendamos revisar
            esta página de vez en cuando.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-display text-lg mt-8 mb-2">10. Contacto</h2>
          <p>
            Para ejercer tus derechos o cualquier consulta sobre privacidad, puedes contactarnos
            a través de los canales indicados en la web (correo electrónico o formulario de
            contacto).
          </p>
        </section>
      </div>
    </div>
  );
}
