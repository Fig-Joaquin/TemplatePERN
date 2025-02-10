import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { fetchVehicles } from "../services/vehicleService";
import { createQuotation } from "../services/quotationService";
import { Quotation } from "../types/interfaces";
import { fetchProducts } from "../services/productService"; // Import the fetchProducts function
import React from "react";

const QuotationCreatePage = () => {
    const [description, setDescription] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]); // State for products
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // State for selected products
    const [showProductModal, setShowProductModal] = useState(false); // State for modal visibility
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchVehiclesData = async () => {
            try {
                const res = await fetchVehicles();
                setVehicles(res);
            } catch (error) {
                toast.error("Error al cargar vehículos");
            }
        };

        const fetchProductsData = async () => {
            try {
                const res = await fetchProducts();
                setProducts(res);
            } catch (error) {
                toast.error("Error al cargar productos");
            }
        };

        fetchVehiclesData();
        fetchProductsData();
    }, []);

    const handleProductChange = (productId: string) => {
        setSelectedProducts((prevSelectedProducts) => 
            prevSelectedProducts.includes(productId)
                ? prevSelectedProducts.filter((id) => id !== productId)
                : [...prevSelectedProducts, productId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vehicleId || !description || selectedProducts.length === 0) {
            toast.error("Todos los campos son obligatorios");
            return;
        }
        setLoading(true);
        try {
            const selectedVehicle = vehicles.find(
                (v) => v.vehicle_id === Number(vehicleId)
            );
            const newQuotation: Omit<Quotation, "quotation_id" | "entry_date"> = {
                vehicle: selectedVehicle,
                description,
                quotation_Status: "pending",
            };
            await createQuotation(newQuotation);
            // Save selected products in WorkProductDetails
            // await saveWorkProductDetails(selectedProducts); // Implement this function
            toast.success("Cotización creada exitosamente");
            navigate("/quotations");
        } catch (error) {
            toast.error("Error al crear la cotización");
        } finally {
            setLoading(false);
        }
    };

    const formatPriceCLP = (price: number) => {
        return price.toLocaleString("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    const totalPrice = selectedProducts.reduce((total, productId) => {
        const product = products.find(p => p.product_id === productId);
        return total + (product ? Number(product.sale_price) : 0);
    }, 0);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crear Nueva Cotización</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2">Vehículo</label>
                    <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                            <Tab
                                className={({ selected }) =>
                                    selected
                                        ? "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 bg-white shadow"
                                        : "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-100 hover:bg-white/[0.12] hover:text-white"
                                }
                            >
                                Personas
                            </Tab>
                            <Tab
                                className={({ selected }) =>
                                    selected
                                        ? "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 bg-white shadow"
                                        : "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-100 hover:bg-white/[0.12] hover:text-white"
                                }
                            >
                                Empresas
                            </Tab>
                        </Tab.List>
                        <Tab.Panels className="mt-2">
                            <Tab.Panel className="rounded-xl bg-white p-3">
                                <select
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2"
                                >
                                    <option value="">Seleccione un vehículo</option>
                                    {vehicles
                                        .filter((vehicle) => vehicle.owner)
                                        .map((vehicle) => (
                                            <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                                {vehicle.license_plate} - {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name} - {vehicle.owner?.name}
                                            </option>
                                        ))}
                                </select>
                            </Tab.Panel>
                            <Tab.Panel className="rounded-xl bg-white p-3">
                                <select
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2"
                                >
                                    <option value="">Seleccione un vehículo</option>
                                    {vehicles
                                        .filter((vehicle) => vehicle.company)
                                        .map((vehicle) => (
                                            <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                                                {vehicle.license_plate} - {vehicle.model?.brand?.brand_name} {vehicle.model?.model_name} - {vehicle.company?.name}
                                            </option>
                                        ))}
                                </select>
                            </Tab.Panel>
                        </Tab.Panels>
                    </Tab.Group>
                </div>
                <div>
                    <label className="block mb-2">Respuestos Seleccionados</label>
                    <ul className="mt-2 space-y-2">
                        {selectedProducts.map((productId) => {
                            const product = products.find(p => p.product_id === productId);
                            return (
                                <li key={productId} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                                    <span>{product?.product_name} - {formatPriceCLP(Number(product?.sale_price))}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleProductChange(productId)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Eliminar
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-2 text-right font-bold">
                        Total: {formatPriceCLP(totalPrice)}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowProductModal(true)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Añadir Repuesto
                    </button>
                </div>
                <div>
                    <label className="block mb-2">Descripción</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded p-2"
                        placeholder="Ingrese la descripción de la cotización"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {loading ? "Creando..." : "Crear Cotización"}
                </button>
            </form>
            <Transition appear show={showProductModal} as={Fragment}>
                <Dialog
                    as="div"
                    className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
                    onClose={() => setShowProductModal(false)}
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
                        <Dialog.Panel className="w-96 bg-white shadow-lg rounded-lg p-6">
                            <Dialog.Title className="text-xl font-bold mb-4">
                                Seleccionar los respuestos a utilizar
                            </Dialog.Title>
                            <div className="mt-2">
                                <ul className="space-y-2">
                                    {products.map((product) => (
                                        <li key={product.product_id}>
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    value={product.product_id}
                                                    checked={selectedProducts.includes(product.product_id)}
                                                    onChange={() => handleProductChange(product.product_id)}
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                />
                                                <span className="text-gray-900">{product.product_name} - {formatPriceCLP(Number(product.sale_price))}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 border rounded"
                                    onClick={() => setShowProductModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    onClick={() => setShowProductModal(false)}
                                >
                                    Guardar
                                </button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </Dialog>
            </Transition>
        </div>
    );
};

export default QuotationCreatePage;