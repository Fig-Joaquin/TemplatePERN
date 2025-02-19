import type React from "react"
import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 backdrop-blur-md flex justify-center items-center z-10"
        onClose={onClose}
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
            <Dialog.Title className="text-xl font-bold mb-4">Confirmar eliminación</Dialog.Title>
            <p>¿Está seguro que desea eliminar este cliente?</p>
            <div className="mt-6 flex justify-end">
              <button className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={onClose}>
                Cancelar
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={onConfirm}>
                Eliminar
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}

export default DeleteConfirmationModal

