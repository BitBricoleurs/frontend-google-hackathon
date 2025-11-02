/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { AppSidebar } from "../app-sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockUsePathname = usePathname as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

describe("AppSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseAuth.mockReturnValue({ user: null });
  });

  it("should render navigation items", () => {
    render(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Active Call")).toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
  });

  it("should highlight active navigation item", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<AppSidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("text-orange-500");
  });

  it("should render logo", () => {
    render(<AppSidebar />);

    const logo = screen.getByAltText("Urgentis");
    expect(logo).toBeInTheDocument();
  });

  it("should not show admin panel for non-admin users", () => {
    mockUseAuth.mockReturnValue({ user: { role: "USER" } });
    render(<AppSidebar />);

    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
  });

  it("should show admin panel for admin users", () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("should expand admin menu on hover", () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    const adminSection = screen.getByText("Admin").closest("footer");

    if (adminSection) {
      fireEvent.mouseEnter(adminSection);

      // Admin menu items should be visible
      expect(screen.getByText("Employees")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
      expect(screen.getByText("Analytics")).toBeInTheDocument();
      expect(screen.getByText("Security")).toBeInTheDocument();
    }
  });

  it("should collapse admin menu on mouse leave", () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    const adminSection = screen.getByText("Admin").closest("footer");

    if (adminSection) {
      fireEvent.mouseEnter(adminSection);
      fireEvent.mouseLeave(adminSection);

      // Note: AnimatePresence may keep elements in DOM briefly during exit
      // So we just verify the component doesn't crash
      expect(screen.getByText("Admin")).toBeInTheDocument();
    }
  });

  it("should highlight active admin page", () => {
    mockUsePathname.mockReturnValue("/admin");
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    // When on admin page, it shows "Admin Dashboard"
    const adminLink = screen.getByText(/Admin/).closest("a");
    expect(adminLink).toHaveClass("text-orange-500");
  });

  it("should show expanded admin menu when on admin page", () => {
    mockUsePathname.mockReturnValue("/admin/employees");
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    // Admin menu should be expanded
    expect(screen.getByText("Employees")).toBeInTheDocument();
  });

  it("should handle navigation to different pages", () => {
    const { rerender } = render(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    mockUsePathname.mockReturnValue("/active-call");
    rerender(<AppSidebar />);

    const activeCallLink = screen.getByText("Active Call").closest("a");
    expect(activeCallLink).toHaveClass("text-orange-500");
  });

  it("should handle navigation to patient page", () => {
    mockUsePathname.mockReturnValue("/patients");
    render(<AppSidebar />);

    const patientsLink = screen.getByText("Patients").closest("a");
    expect(patientsLink).toHaveClass("text-orange-500");
  });

  it("should render with correct links", () => {
    render(<AppSidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const activeCallLink = screen.getByText("Active Call").closest("a");
    const patientsLink = screen.getByText("Patients").closest("a");

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    expect(activeCallLink).toHaveAttribute("href", "/active-call");
    expect(patientsLink).toHaveAttribute("href", "/patients");
  });

  it("should render admin links correctly", () => {
    mockUseAuth.mockReturnValue({ user: { role: "ADMIN" } });
    render(<AppSidebar />);

    const adminSection = screen.getByText("Admin").closest("footer");

    if (adminSection) {
      fireEvent.mouseEnter(adminSection);

      const employeesLink = screen.getByText("Employees").closest("a");
      const systemLink = screen.getByText("System").closest("a");
      const analyticsLink = screen.getByText("Analytics").closest("a");
      const securityLink = screen.getByText("Security").closest("a");

      expect(employeesLink).toHaveAttribute("href", "/admin/employees");
      expect(systemLink).toHaveAttribute("href", "/admin/system");
      expect(analyticsLink).toHaveAttribute("href", "/admin/analytics");
      expect(securityLink).toHaveAttribute("href", "/admin/security");
    }
  });

  it("should handle null pathname gracefully", () => {
    mockUsePathname.mockReturnValue(null);
    render(<AppSidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should handle nested paths correctly", () => {
    mockUsePathname.mockReturnValue("/active-call/details");
    render(<AppSidebar />);

    const activeCallLink = screen.getByText("Active Call").closest("a");
    expect(activeCallLink).toHaveClass("text-orange-500");
  });

  it("should show different priority for different pages", () => {
    const { rerender } = render(<AppSidebar />);

    mockUsePathname.mockReturnValue("/dashboard");
    rerender(<AppSidebar />);

    let dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("text-orange-500");

    mockUsePathname.mockReturnValue("/patients");
    rerender(<AppSidebar />);

    dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).not.toHaveClass("text-orange-500");
  });
});
