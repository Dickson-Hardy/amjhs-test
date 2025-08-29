import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { vi } from "vitest"
import { Header } from "@/components/header"

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}))

describe("Header", () => {
  it("renders the AMHSJ logo", () => {
    render(<Header />)
    expect(screen.getByText("AMHSJ")).toBeInTheDocument()
    expect(screen.getByText("IoT Research Journal")).toBeInTheDocument()
  })

  it("renders navigation items", () => {
    render(<Header />)
    expect(screen.getByText("IoT Research")).toBeInTheDocument()
    expect(screen.getByText("For Researchers")).toBeInTheDocument()
    expect(screen.getByText("About AMHSJ")).toBeInTheDocument()
  })

  it("renders login and join buttons", () => {
    render(<Header />)
    expect(screen.getByText("Login")).toBeInTheDocument()
    expect(screen.getByText("Join AMHSJ")).toBeInTheDocument()
  })
})
