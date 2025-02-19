import type React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  searchTerm: string
  handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const SearchBar = ({ searchTerm, handleSearch }: SearchBarProps) => {
  return (
    <div className="mb-4 relative">
      <Input
        type="text"
        placeholder="Buscar por nombre o RUT"
        value={searchTerm}
        onChange={handleSearch}
        className="w-full px-4 py-2 border rounded-lg pl-10 bg-background text-foreground"
      />
      <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-2.5" />
    </div>
  )
}

export default SearchBar

