import { useEffect, useState, Fragment } from "react";
import { Dialog, Popover, Transition } from "@headlessui/react";
import { Quotation } from "../types/interfaces";
import { fetchQuotations } from "../services/quotationService";
import { toast } from "react-toastify";
import { formatDate } from "../utils/formDate";
import { VehicleCard } from "../components/VehicleCard";



const QuotationPage = () => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchQuotations();
                setQuotations(response);
            } catch (error) {
                console.error("Error al obtener las cotizaciones:", error);
                toast.error("Error al obtener las cotizaciones");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);



    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Cotizaciones</h2>
            </div>
            {loading ? (
                <p>Cargando...</p>
            ) : quotations.length === 0 ? (
                <p>No hay cotizaciones.</p>
            ) : (
                <div className="bg-white/30 backdrop-blur-md rounded-lg shadow p-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Fecha de Entrada
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quotations.map((q) => (
                                <tr key={q.quotation_id}>
                                    <td className="px-4 py-2">{q.quotation_id}</td>
                                    <td className="px-4 py-2">{q.description}</td>
                                    <td className="px-4 py-2">{q.quotation_Status}</td>
                                    <td className="px-4 py-2">{formatDate(q.entry_date)}</td>
                                    <td className="px-4 py-2">
                                        <Popover className="relative">
                                            <Popover.Button className="text-blue-600 underline">
                                                {q.vehicle?.license_plate}
                                            </Popover.Button>
                                            <Transition
                                                as={Fragment}
                                                enter="transition ease-out duration-200"
                                                enterFrom="opacity-0 translate-y-1"
                                                enterTo="opacity-100 translate-y-0"
                                                leave="transition ease-in duration-150"
                                                leaveFrom="opacity-100 translate-y-0"
                                                leaveTo="opacity-0 translate-y-1"
                                            >
                                                <Popover.Panel className="absolute z-10 mt-2 w-80 bg-white shadow-lg p-4 left-1/2 transform -translate-x-1/2">
                                                    <VehicleCard vehicle={q.vehicle} />
                                                </Popover.Panel>
                                            </Transition>
                                        </Popover>
                                    </td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => setSelectedQuotation(q)}
                                            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Dialog for Quotation Details */}
            <Transition appear show={selectedQuotation !== null} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={() => setSelectedQuotation(null)}
                >
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-3xl bg-white border rounded-md p-6 shadow-lg">
                            {selectedQuotation && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-bold">Información de la cotización</h4>
                                        <p>ID: {selectedQuotation.quotation_id}</p>
                                        <p>Descripción: {selectedQuotation.description}</p>
                                        <p>Estado: {selectedQuotation.quotation_Status}</p>
                                        <p>Fecha de entrada: {formatDate(selectedQuotation.entry_date)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Información del vehículo</h4>
                                        <p>Placa: {selectedQuotation.vehicle?.license_plate}</p>
                                        <p>Estado: {selectedQuotation.vehicle?.vehicle_status}</p>
                                        <p>Año: {selectedQuotation.vehicle?.year}</p>
                                        <p>Color: {selectedQuotation.vehicle?.color}</p>
                                        <p>Modelo: {selectedQuotation.vehicle?.model.model_name}</p>
                                        <p>Marca: {selectedQuotation.vehicle?.model.brand.brand_name}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Información del Propietario</h4>
                                        {selectedQuotation.vehicle?.owner ? (
                                            <div>
                                                <p>
                                                    {`${selectedQuotation.vehicle?.owner.name} ${selectedQuotation.vehicle?.owner.first_surname} ${selectedQuotation.vehicle?.owner.second_surname}`}
                                                </p>
                                                <p>RUT: {selectedQuotation.vehicle?.owner.rut}</p>
                                                <p>Email: {selectedQuotation.vehicle?.owner.email}</p>
                                                <p>Teléfono: {selectedQuotation.vehicle?.owner.number_phone}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p>Empresa: {selectedQuotation.vehicle?.company?.name}</p>
                                                <p>RUT: {selectedQuotation.vehicle?.company?.rut}</p>
                                                <p>Email: {selectedQuotation.vehicle?.company?.email}</p>
                                                {/* <p>Teléfono: {selectedQuotation.vehicle?.company?.number_phone}</p> */}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Historial de Kilometraje</h4>
                                        {selectedQuotation.vehicle?.mileage_history.map((mh) => (
                                            <p key={mh.mileage_history_id}>
                                                {formatDate(mh.registration_date)}: {mh.current_mileage} km
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
};

export default QuotationPage;