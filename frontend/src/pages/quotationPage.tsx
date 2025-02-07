import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { Quotation } from "../types/interfaces";



const quotationPage = () => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotations = async () => {
            try {
                const response = await api.get<Quotation[]>("/quotations");
                setQuotations(response.data);
            } catch (error) {
                console.error("Error al obtener las cotizaciones:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotations();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-center text-2xl font-bold mb-4">Listado de Cotizaciones</h1>
            {loading ? (
                <p>Cargando...</p>
            ) : quotations.length === 0 ? (
                <p>No hay cotizaciones.</p>
            ) : (
                <ul>
                    {quotations.map((q) => (
                        <li key={q.quotation_id} className="border p-4 mb-2 rounded">
                            <p><strong>ID:</strong> {q.quotation_id}</p>
                            <p><strong>Descripción:</strong> {q.description}</p>
                            <p><strong>Estado:</strong> {q.quotation_Status}</p>
                            {q.vehicle && (
                                <p>
                                    <strong>Vehículo:</strong> {q.vehicle.license_plate}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default quotationPage;