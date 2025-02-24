import PDFDocument from 'pdfkit';
import { Request, Response } from 'express';
import path from 'path';
import { AppDataSource } from "../../config/ormconfig";
import { Quotation } from "../../entities/work/quotationEntity";
import { WorkProductDetail } from "../../entities/work/workProductDetailEntity";
import { formatPriceCLP } from "../../utils/formatPriceCLP";

const quotationRepository = AppDataSource.getRepository(Quotation);
const workProductDetailRepository = AppDataSource.getRepository(WorkProductDetail);

export const generateQuotationPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const quotationId = parseInt(req.params.id);

        const quotation = await quotationRepository.findOne({
            where: { quotation_id: quotationId },
            relations: [
                "vehicle",
                "vehicle.model",
                "vehicle.model.brand",
                "vehicle.owner",
                "vehicle.company",
                "vehicle.mileage_history"

            ]
        });

        if (!quotation) {
            res.status(404).json({ message: "Cotización no encontrada" });
            return;
        }

        const details = await workProductDetailRepository.find({
            where: { quotation: { quotation_id: quotationId } },
            relations: ["product", "tax"]
        });

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=cotizacion-${quotationId}.pdf`);
        doc.pipe(res);

        // Logo
        const pageWidth = 612; // Ancho estándar de página A4 en puntos
        const logoWidth = 200;
        const logoPath = path.resolve(__dirname, '../../public/taller_logo.png');
        doc.image(logoPath, 0, 0, { width: logoWidth }); // Alineado con el cuadro de cotización (y=30)

        // Título y datos de la empresa - Centrado
        doc.font('Times-Bold')
            .fontSize(14)
            .text('TALLER MECANICO A&M SPA', 0, 85, {
                align: 'center',
                width: pageWidth
            });

        // Información de contacto centrada
        doc.font('Times-Roman')
            .fontSize(10)
            .text('Concepción – Chile', 0, 105, {
                align: 'center',
                width: pageWidth
            })
            .text('Rut: 76.755.119-3', 0, 120, {
                align: 'center',
                width: pageWidth
            })
            .text('Teléfono: 998292870', 0, 135, {
                align: 'center',
                width: pageWidth
            });

        // Email con hipervínculo
        const email = 'ronald.mecanico@gmail.com';
        doc.fontSize(10)
            .fillColor('black')
            .text('Email: ', (pageWidth - doc.widthOfString(`Email: ${email}`)) / 2, 150, { continued: true })
            .fillColor('blue')
            .text(email, { link: `mailto:${email}` });
    

        // Cuadro de información de cotización (alineado a la derecha con margen)
        const boxWidth = 150;
        const boxHeight = 50;
        const boxMargin = 40;
        const boxX = pageWidth - boxWidth - boxMargin;
        const boxY = 30;
        const padding = 10; // Margen interno para todos los lados

        // Dibujar el cuadro con bordes redondeados
        doc.lineWidth(1)
            .strokeColor('#008000')
            .roundedRect(boxX, boxY, boxWidth, boxHeight, 5)
            .stroke();

        // Configuración para el texto dentro del cuadro (centrado y con márgenes uniformes)
        const textWidth = boxWidth - 2 * padding;
        const firstLineY = boxY + padding;
        const lineHeight = 14; // Aproximado para fontSize 10
        const secondLineY = firstLineY + lineHeight + 5; // separación extra de 5px

        doc.fillColor('black')
            .font('Times-Roman')
            .fontSize(10)
            .text(`No. Cotización: ${quotation.quotation_id}`, boxX + padding, firstLineY, {
            width: textWidth,
            align: 'center'
            })
            .text(`Fecha: ${new Date(quotation.entry_date).toLocaleDateString('es-CL')}`, boxX + padding, secondLineY, {
            width: textWidth,
            align: 'center'
            });

        // Información del cliente
        doc.strokeColor('#008000')
            .roundedRect(40, 180, 520, 100, 5)
            .stroke();

        // Labels con espaciado correcto
        doc.font('Times-Bold')
            .fontSize(10)
            .text('Nombre cliente:', 50, 205)
            .text('Vehículo:', 50, 230)
            .text('Detalle:', 50, 255);

        // Valores con alineación ajustada
        doc.font('Times-Roman')
            .text(
                quotation.vehicle?.company?.name ||
                    `${quotation.vehicle?.owner?.name} ${quotation.vehicle?.owner?.first_surname}`,
                150,
                205
            )
            .text(
                `${quotation.vehicle?.model?.brand?.brand_name || ''} ${quotation.vehicle?.model?.model_name || ''} ${quotation.vehicle?.license_plate || ''} Km ${
                    Array.isArray(quotation.vehicle?.mileage_history) && quotation.vehicle.mileage_history.length
                        ? Number(
                                quotation.vehicle.mileage_history[quotation.vehicle.mileage_history.length - 1]
                                    .current_mileage
                            ).toLocaleString('es-CL')
                        : quotation.vehicle?.mileage_history &&
                            (quotation.vehicle?.mileage_history as any).current_mileage
                        ? Number(
                                (quotation.vehicle?.mileage_history as any).current_mileage
                            ).toLocaleString('es-CL')
                        : ''
                }`,
                150,
                230
            )
            .text(quotation.description || '', 150, 255);

        // Tabla
        let yPos = 300;

        // Cabecera de la tabla con color específico
        doc.fillColor('#4A90E2')
            .rect(40, yPos, 520, 25)
            .fill();

        // Columnas de la tabla con espaciado correcto
        doc.fillColor('white')
            .font('Times-Bold')
            .text('Cantidad', 50, yPos + 7)
            .text('Descripción', 120, yPos + 7)
            .text('Precio', 300, yPos + 7)
            .text('Mano de obra', 400, yPos + 7)
            .text('Precio total', 480, yPos + 7);

        // Contenido de la tabla
        doc.fillColor('black');
        yPos += 25;

        let subTotal = 0;
        let totalIVA = 0;

        details.forEach(detail => {
            const taxRate = Number(detail.tax?.tax_rate || 0) / 100;
            const profitMargin = Number(detail.product?.profit_margin || 0) / 100;
            const priceWithMargin = Number(detail.product?.sale_price || 0) * (1 + profitMargin);
            const laborPrice = Number(detail.labor_price || 0);
            const subtotal = (priceWithMargin * detail.quantity) + laborPrice;
            const iva = subtotal * taxRate;

            // Margen superior e inferior para el nombre del producto
            const productMarginTop = 3;
            const productMarginBottom = 3;

            doc.font('Times-Roman')
                .fontSize(10)
                .text(detail.quantity.toString(), 50, yPos + 7)
                .text(
                    detail.product?.product_name || '',
                    120,
                    yPos + 7 + productMarginTop,
                    { width: 180 }
                )
                .text(formatPriceCLP(priceWithMargin), 300, yPos + 7)
                .text(formatPriceCLP(laborPrice), 400, yPos + 7)
                .text(formatPriceCLP(subtotal), 480, yPos + 7);

            subTotal += subtotal;
            totalIVA += iva;
            // Incrementar la posición en Y incluyendo el margen inferior del product name
            yPos += 25 + productMarginTop + productMarginBottom;
        });

        // Línea separadora antes de los totales
        doc.lineWidth(0.5)
            .moveTo(40, yPos)
            .lineTo(560, yPos)
            .stroke();

        // Totales con alineación ajustada
        yPos += 20;
        const totalX = 480; // Alineación de montos
        const labelX = 400; // Alineación de etiquetas

        doc.font('Times-Roman')
            .text('SUBTOTAL', labelX, yPos)
            .text(formatPriceCLP(subTotal), totalX, yPos);

        yPos += 20;
        doc.text('IVA (19.00%)', labelX, yPos)
            .text(formatPriceCLP(totalIVA), totalX, yPos);

        // Línea gruesa antes del total final
        yPos += 15;
        doc.lineWidth(1.5)
            .moveTo(390, yPos)
            .lineTo(560, yPos)
            .stroke();

        yPos += 10;
        doc.font('Times-Bold')
            .text('TOTAL', labelX, yPos)
            .text(formatPriceCLP(subTotal + totalIVA), totalX, yPos);

        // Mensaje final
        doc.font('Times-Italic')
            .fontSize(12)
            .text('¡Gracias por preferirnos!', 0, yPos + 50, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generando el PDF:', error);
        res.status(500).json({ message: 'Error generando el PDF' });
    }
};