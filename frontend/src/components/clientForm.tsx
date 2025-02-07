import { ClientFormProps } from "../types/interfaces";

const ClientForm = ({ formData, handleInputChange, handleSubmit, onCancel }: ClientFormProps) => {
    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-sm mb-1">RUT</label>
                <input
                    type="text"
                    name="rut"
                    value={formData.rut}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Nombre</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Primer Apellido</label>
                <input
                    type="text"
                    name="first_surname"
                    value={formData.first_surname}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Segundo Apellido</label>
                <input
                    type="text"
                    name="second_surname"
                    value={formData.second_surname}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm mb-1">Teléfono</label>
                <input
                    type="text"
                    name="number_phone"
                    value={formData.number_phone}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2 bg-white text-gray-900"
                    required
                />
            </div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border rounded"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded shadow-md hover:bg-blue-700 transition"
                >
                    {formData.person_type === "cliente" ? "Añadir" : "Actualizar"}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;