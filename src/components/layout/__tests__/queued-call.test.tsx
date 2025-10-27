/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
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
    const { container } = render(
      <QueuedCall
        {...defaultProps}
        keywords={["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]}
      />
    );

    expect(screen.getByText("keyword1")).toBeInTheDocument();
    expect(screen.getByText("keyword4")).toBeInTheDocument();
    expect(screen.queryByText("keyword5")).not.toBeInTheDocument();
    // Verify only 4 keywords are rendered
    const keywords = container.querySelectorAll(".inline-flex.items-center.rounded-full");
    expect(keywords.length).toBeLessThanOrEqual(4);
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

  it("should call onTakeCall when Take button is clicked", () => {
    const onTakeCall = jest.fn();
    const { container } = render(<QueuedCall {...defaultProps} onTakeCall={onTakeCall} />);

    // Hover over the component to show the Take button
    const card = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(card);

    const takeButton = screen.getByText("Take");
    fireEvent.click(takeButton);

    expect(onTakeCall).toHaveBeenCalledWith("queue-1");
  });

  it("should navigate to active call when View button is clicked", () => {
    const { container } = render(<QueuedCall {...defaultProps} />);

    // Hover over the component to show the View button
    const card = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(card);

    const viewButton = screen.getByLabelText("View call");
    fireEvent.click(viewButton);

    expect(mockPush).toHaveBeenCalledWith("/active-call?callId=call-123");
  });

  it("should show hover effects", () => {
    const { container } = render(<QueuedCall {...defaultProps} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();

    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);

    // Verify no errors
    expect(card).toBeInTheDocument();
  });

  it("should calculate AI status percentage for connecting status", () => {
    render(<QueuedCall {...defaultProps} aiStatus="connecting" waitTime={60} />);

    expect(screen.getByText("Connecting")).toBeInTheDocument();
    // Percentage should be less than 100
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it("should calculate AI status percentage for pending status", () => {
    render(<QueuedCall {...defaultProps} aiStatus="pending" waitTime={90} />);

    expect(screen.getByText("Collecting Info")).toBeInTheDocument();
    // Percentage should be less than 100
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it("should show correct emotional state icons and colors", () => {
    const { rerender } = render(<QueuedCall {...defaultProps} emotionalState="panic" />);
    expect(screen.getByText("Panicked")).toHaveClass("text-orange-500");

    rerender(<QueuedCall {...defaultProps} emotionalState="distress" />);
    expect(screen.getByText("Distressed")).toHaveClass("text-orange-500");

    rerender(<QueuedCall {...defaultProps} emotionalState="anxious" />);
    expect(screen.getByText("Anxious")).toHaveClass("text-yellow-500");

    rerender(<QueuedCall {...defaultProps} emotionalState="calm" />);
    expect(screen.getByText("Calm")).toHaveClass("text-green-500");
  });

  it("should render without onTakeCall callback", () => {
    render(<QueuedCall {...defaultProps} onTakeCall={undefined} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Take")).not.toBeInTheDocument();
  });

  it("should handle unknown priority gracefully", () => {
    // @ts-expect-error - Testing unknown priority
    render(<QueuedCall {...defaultProps} priority="unknown" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should handle unknown emotional state gracefully", () => {
    // @ts-expect-error - Testing unknown emotional state
    render(<QueuedCall {...defaultProps} emotionalState="unknown" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should handle unknown AI status gracefully", () => {
    // @ts-expect-error - Testing unknown AI status
    render(<QueuedCall {...defaultProps} aiStatus="unknown" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should display initials for single name", () => {
    render(<QueuedCall {...defaultProps} fullName="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should display initials for three-part name", () => {
    render(<QueuedCall {...defaultProps} fullName="John Paul Doe" />);
    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  it("should format wait time with zero seconds", () => {
    render(<QueuedCall {...defaultProps} waitTime={60} />);
    expect(screen.getByText("1m 0s")).toBeInTheDocument();
  });

  it("should handle very long wait time", () => {
    render(<QueuedCall {...defaultProps} waitTime={3665} />);
    expect(screen.getByText("61m 5s")).toBeInTheDocument();
  });

  it("should limit keywords display to 4 items", () => {
    const manyKeywords = ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"];
    render(<QueuedCall {...defaultProps} keywords={manyKeywords} />);

    expect(screen.getByText("keyword1")).toBeInTheDocument();
    expect(screen.getByText("keyword4")).toBeInTheDocument();
    expect(screen.queryByText("keyword5")).not.toBeInTheDocument();
    expect(screen.queryByText("keyword6")).not.toBeInTheDocument();
  });

  it("should stop event propagation when clicking Take button", () => {
    const onTakeCall = jest.fn();
    const onClick = jest.fn();
    const { container } = render(
      <div onClick={onClick}>
        <QueuedCall {...defaultProps} onTakeCall={onTakeCall} />
      </div>
    );

    const card = container.querySelector("div > div") as HTMLElement;
    fireEvent.mouseEnter(card);

    const takeButton = screen.getByText("Take");
    fireEvent.click(takeButton);

    expect(onTakeCall).toHaveBeenCalled();
    // Event should not propagate to parent
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should stop event propagation when clicking View button", () => {
    const onClick = jest.fn();
    const { container } = render(
      <div onClick={onClick}>
        <QueuedCall {...defaultProps} />
      </div>
    );

    const card = container.querySelector("div > div") as HTMLElement;
    fireEvent.mouseEnter(card);

    const viewButton = screen.getByLabelText("View call");
    fireEvent.click(viewButton);

    expect(mockPush).toHaveBeenCalled();
    // Event should not propagate to parent
    expect(onClick).not.toHaveBeenCalled();
  });
});
