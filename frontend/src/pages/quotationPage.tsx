"use client"

import { useEffect, useState } from "react"
import type { Quotation, WorkProductDetail } from "@/types/interfaces"
import { fetchQuotations } from "@/services/quotationService"
import { getWorkProductDetailsByQuotationId } from "@/services/workProductDetail"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { Toast } from "@/components/ui/toast"

export default function QuotationPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [loading, setLoading] = useState(true)
    const [workProductDetails, setWorkProductDetails] = useState<WorkProductDetail[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchQuotations()
                setQuotations(response)

                const detailsPromises = response.map((q) => getWorkProductDetailsByQuotationId(q.quotation_id!))
                const detailsResults = await Promise.all(detailsPromises)
                const allDetails = detailsResults.flat()
                setWorkProductDetails(allDetails)
            } catch (error) {
                console.error("Error al obtener las cotizaciones:", error)
                Toast({
                    title: "Error: No se pudieron obtener las cotizaciones",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const data = quotations.map((quotation) => ({
        ...quotation,
        totalPrice: quotation.total_price || 0,
        details: workProductDetails.filter((detail) => detail.quotation_id === quotation.quotation_id),
    }))

    return (
        <div className="container mx-auto py-10">
            <h2 className="text-3xl font-bold tracking-tight mb-5">Cotizaciones</h2>
            {loading ? <p>Cargando...</p> : <DataTable columns={columns} data={data} />}
        </div>
    )
}

