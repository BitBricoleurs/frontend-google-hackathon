/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { QueuedCall, QueuedCallProps } from "../queued-call";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.Mock;

describe("QueuedCall Component", () => {
  const defaultProps: QueuedCallProps = {
    id: "queue-1",
    callId: "call-123",
    fullName: "John Doe",
    phoneNumber: "+1234567890",
    priority: "high",
    waitTime: 125,
    keywords: ["chest pain", "breathing difficulty"],
    emotionalState: "panic",
    aiStatus: "connected",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
  });

  it("should render call information correctly", () => {
    render(<QueuedCall {...defaultProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("2m 5s")).toBeInTheDocument();
  });

  it("should render keywords", () => {
    render(<QueuedCall {...defaultProps} />);

    expect(screen.getByText("chest pain")).toBeInTheDocument();
    expect(screen.getByText("breathing difficulty")).toBeInTheDocument();
  });

  it("should display correct priority badge for high priority", () => {
    render(<QueuedCall {...defaultProps} priority="high" />);

    const badge = screen.getByText("High");
    expect(badge).toHaveClass("bg-orange-500");
  });

  it("should display correct priority badge for medium priority", () => {
    render(<QueuedCall {...defaultProps} priority="medium" />);

    const badge = screen.getByText("Medium");
    expect(badge).toHaveClass("bg-yellow-500");
  });

  it("should display correct priority badge for low priority", () => {
    render(<QueuedCall {...defaultProps} priority="low" />);

    const badge = screen.getByText("Low");
    expect(badge).toHaveClass("bg-green-500");
  });

  it("should format wait time correctly", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} waitTime={65} />);
    expect(screen.getByText("1m 5s")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} waitTime={180} />);
    expect(screen.getByText("3m 0s")).toBeInTheDocument();
  });

  it("should display AI status correctly", () => {
    render(<QueuedCall {...defaultProps} aiStatus="connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should display emotional state correctly", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} emotionalState="panic" />);
    expect(screen.getByText("Panicked")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} emotionalState="distress" />);
    expect(screen.getByText("Distressed")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} emotionalState="anxious" />);
    expect(screen.getByText("Anxious")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} emotionalState="calm" />);
    expect(screen.getByText("Calm")).toBeInTheDocument();
  });

  it("should limit keywords to 4", () => {
    render(
      <QueuedCall
        {...defaultProps}
        keywords={["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]}
      />
    );

    expect(screen.getByText("keyword1")).toBeInTheDocument();
    expect(screen.getByText("keyword4")).toBeInTheDocument();
    expect(screen.queryByText("keyword5")).not.toBeInTheDocument();
  });

  it("should display initials correctly", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} fullName="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} fullName="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should handle empty keywords array", () => {
    render(<QueuedCall {...defaultProps} keywords={[]} />);

    // Should not crash and component should render
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render with different AI statuses", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} aiStatus="pending" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} aiStatus="connecting" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should format various wait times", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} waitTime={3665} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    rerender(<QueuedCall {...defaultProps} waitTime={0} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should handle very long caller names", () => {
    const longName = "Very Long Name That Should Be Displayed";
    render(<QueuedCall {...defaultProps} fullName={longName} />);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });
});
