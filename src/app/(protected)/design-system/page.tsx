"use client";

import { useState, useEffect } from "react";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";

type CollapsibleSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const CollapsibleSection = ({ title, defaultOpen = false, children }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-6 text-left hover:bg-muted/50 transition-colors"
      >
        <h2 className="text-base font-medium text-foreground">{title}</h2>
        {isOpen ? (
          <CaretUpIcon className="h-5 w-5 text-muted-foreground" weight="bold" />
        ) : (
          <CaretDownIcon className="h-5 w-5 text-muted-foreground" weight="bold" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

export default function DesignSystemPage() {
  const [tokens, setTokens] = useState<Record<string, string>>({});

  useEffect(() => {
    // Read current CSS variables from root
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    const initialTokens: Record<string, string> = {
      "--background": styles.getPropertyValue("--background").trim(),
      "--foreground": styles.getPropertyValue("--foreground").trim(),
      "--card": styles.getPropertyValue("--card").trim(),
      "--card-foreground": styles.getPropertyValue("--card-foreground").trim(),
      "--popover": styles.getPropertyValue("--popover").trim(),
      "--popover-foreground": styles.getPropertyValue("--popover-foreground").trim(),
      "--primary": styles.getPropertyValue("--primary").trim(),
      "--primary-foreground": styles.getPropertyValue("--primary-foreground").trim(),
      "--secondary": styles.getPropertyValue("--secondary").trim(),
      "--secondary-foreground": styles.getPropertyValue("--secondary-foreground").trim(),
      "--muted": styles.getPropertyValue("--muted").trim(),
      "--muted-foreground": styles.getPropertyValue("--muted-foreground").trim(),
      "--accent": styles.getPropertyValue("--accent").trim(),
      "--accent-foreground": styles.getPropertyValue("--accent-foreground").trim(),
      "--destructive": styles.getPropertyValue("--destructive").trim(),
      "--destructive-foreground": styles.getPropertyValue("--destructive-foreground").trim(),
      "--border": styles.getPropertyValue("--border").trim(),
      "--input": styles.getPropertyValue("--input").trim(),
      "--ring": styles.getPropertyValue("--ring").trim(),
      "--chart-1": styles.getPropertyValue("--chart-1").trim(),
      "--chart-2": styles.getPropertyValue("--chart-2").trim(),
      "--chart-3": styles.getPropertyValue("--chart-3").trim(),
      "--chart-4": styles.getPropertyValue("--chart-4").trim(),
      "--chart-5": styles.getPropertyValue("--chart-5").trim(),
      "--radius": styles.getPropertyValue("--radius").trim(),
      "--spacing": styles.getPropertyValue("--spacing").trim(),
      "--shadow-color": styles.getPropertyValue("--shadow-color").trim(),
      "--shadow-opacity": styles.getPropertyValue("--shadow-opacity").trim(),
      "--shadow-blur": styles.getPropertyValue("--shadow-blur").trim(),
      "--shadow-spread": styles.getPropertyValue("--shadow-spread").trim(),
      "--shadow-x": styles.getPropertyValue("--shadow-x").trim(),
      "--shadow-y": styles.getPropertyValue("--shadow-y").trim(),
    };

    setTokens(initialTokens);
  }, []);

  const updateToken = (name: string, value: string) => {
    setTokens((prev) => ({ ...prev, [name]: value }));
    document.documentElement.style.setProperty(name, value);
  };

  const exportCSS = () => {
    const css = `:root {
${Object.entries(tokens)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join("\n")}
}`;

    navigator.clipboard.writeText(css);
    alert("CSS copied to clipboard!");
  };

  const resetToDefaults = () => {
    const defaults: Record<string, string> = {
      "--background": "oklch(0.97 0.005 264)",
      "--foreground": "oklch(0.25 0.01 264)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.25 0.01 264)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.25 0.01 264)",
      "--primary": "oklch(0.68 0.19 35)",
      "--primary-foreground": "oklch(1 0 0)",
      "--secondary": "oklch(0.95 0.01 85)",
      "--secondary-foreground": "oklch(0.25 0.01 264)",
      "--muted": "oklch(0.96 0.005 264)",
      "--muted-foreground": "oklch(0.55 0.01 264)",
      "--accent": "oklch(0.65 0.10 200)",
      "--accent-foreground": "oklch(1 0 0)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--destructive-foreground": "oklch(1 0 0)",
      "--border": "oklch(0.92 0.005 264)",
      "--input": "oklch(0.94 0.005 264)",
      "--ring": "oklch(0.68 0.19 35)",
      "--chart-1": "oklch(0.68 0.19 35)",
      "--chart-2": "oklch(0.65 0.10 200)",
      "--chart-3": "oklch(0.75 0.15 85)",
      "--chart-4": "oklch(0.62 0.17 45)",
      "--chart-5": "oklch(0.70 0.12 220)",
      "--radius": "0.75rem",
      "--spacing": "0.25rem",
      "--shadow-color": "oklch(0.25 0.01 264)",
      "--shadow-opacity": "0.08",
      "--shadow-blur": "8px",
      "--shadow-spread": "0px",
      "--shadow-x": "0",
      "--shadow-y": "2px",
    };

    Object.entries(defaults).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    setTokens(defaults);
  };

  const ColorControl = ({ name, label }: { name: string; label: string }) => {
    const value = tokens[name] || "oklch(1 0 0)";

    return (
      <div className="flex items-center gap-4 py-3">
        <label className="text-sm font-normal text-foreground min-w-[180px]">{label}</label>
        <div className="flex-1 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg border border-border shadow-sm flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <input
            type="text"
            value={value}
            onChange={(e) => updateToken(name, e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    );
  };

  const SliderControl = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    unit = "",
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step: number;
    unit?: string;
  }) => {
    return (
      <div className="space-y-2 py-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-normal text-foreground">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              step={step}
              min={min}
              max={max}
              className="w-20 px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-foreground text-right focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {unit && <span className="text-sm text-muted-foreground min-w-[2rem]">{unit}</span>}
          </div>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    );
  };

  const RadiusSection = () => {
    const value = tokens["--radius"] || "0rem";
    const numValue = parseFloat(value);

    return (
      <div className="space-y-4">
        <SliderControl
          label="Radius"
          value={numValue}
          onChange={(val) => updateToken("--radius", `${val}rem`)}
          min={0}
          max={2}
          step={0.0625}
          unit="rem"
        />

        <div className="grid grid-cols-4 gap-4 pt-4">
          <div className="text-center">
            <div
              className="w-full h-20 bg-primary mx-auto mb-2"
              style={{ borderRadius: `calc(${value} - 4px)` }}
            />
            <span className="text-xs text-muted-foreground">SM</span>
          </div>
          <div className="text-center">
            <div
              className="w-full h-20 bg-primary mx-auto mb-2"
              style={{ borderRadius: `calc(${value} - 2px)` }}
            />
            <span className="text-xs text-muted-foreground">MD</span>
          </div>
          <div className="text-center">
            <div className="w-full h-20 bg-primary mx-auto mb-2" style={{ borderRadius: value }} />
            <span className="text-xs text-muted-foreground">LG</span>
          </div>
          <div className="text-center">
            <div
              className="w-full h-20 bg-primary mx-auto mb-2"
              style={{ borderRadius: `calc(${value} + 4px)` }}
            />
            <span className="text-xs text-muted-foreground">XL</span>
          </div>
        </div>
      </div>
    );
  };

  const SpacingSection = () => {
    const value = tokens["--spacing"] || "0.25rem";
    const numValue = parseFloat(value);

    return (
      <SliderControl
        label="Spacing"
        value={numValue}
        onChange={(val) => updateToken("--spacing", `${val}rem`)}
        min={0}
        max={2}
        step={0.0625}
        unit="rem"
      />
    );
  };

  const ShadowSection = () => {
    const shadowColor = tokens["--shadow-color"] || "oklch(0 0 0)";
    const shadowOpacity = parseFloat(tokens["--shadow-opacity"] || "0.1");
    const shadowBlur = parseFloat(tokens["--shadow-blur"] || "3");
    const shadowSpread = parseFloat(tokens["--shadow-spread"] || "0");
    const shadowX = parseFloat(tokens["--shadow-x"] || "0");
    const shadowY = parseFloat(tokens["--shadow-y"] || "1");

    return (
      <div className="space-y-1">
        <div className="py-3">
          <label className="text-sm font-normal text-foreground mb-3 block">Shadow Color</label>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border border-border shadow-sm flex-shrink-0"
              style={{ backgroundColor: shadowColor }}
            />
            <input
              type="text"
              value={shadowColor}
              onChange={(e) => updateToken("--shadow-color", e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <SliderControl
          label="Shadow Opacity"
          value={shadowOpacity}
          onChange={(val) => updateToken("--shadow-opacity", val.toString())}
          min={0}
          max={1}
          step={0.01}
        />

        <SliderControl
          label="Blur Radius"
          value={shadowBlur}
          onChange={(val) => updateToken("--shadow-blur", `${val}px`)}
          min={0}
          max={50}
          step={1}
          unit="px"
        />

        <SliderControl
          label="Spread"
          value={shadowSpread}
          onChange={(val) => updateToken("--shadow-spread", `${val}px`)}
          min={-20}
          max={20}
          step={1}
          unit="px"
        />

        <SliderControl
          label="Offset X"
          value={shadowX}
          onChange={(val) => updateToken("--shadow-x", val.toString())}
          min={-20}
          max={20}
          step={1}
          unit="px"
        />

        <SliderControl
          label="Offset Y"
          value={shadowY}
          onChange={(val) => updateToken("--shadow-y", `${val}px`)}
          min={-20}
          max={20}
          step={1}
          unit="px"
        />

        <div className="pt-4 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div
            className="w-full h-32 bg-card rounded-lg"
            style={{
              boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor.replace(
                ")",
                ` / ${shadowOpacity})`
              )}`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[420px] border-r border-border bg-card overflow-y-auto h-screen">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground mb-1">Design System</h1>
            <p className="text-sm text-muted-foreground">
              Customize your medical app design tokens
            </p>
          </div>

          <div className="p-3 border-b border-border flex gap-2">
            <button
              onClick={exportCSS}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Export CSS
            </button>
            <button
              onClick={resetToDefaults}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Reset
            </button>
          </div>

          {/* Colors Section */}
          <CollapsibleSection title="Primary Colors" defaultOpen>
            <div className="space-y-1">
              <ColorControl name="--primary" label="Primary" />
              <ColorControl name="--primary-foreground" label="Primary Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Secondary Colors">
            <div className="space-y-1">
              <ColorControl name="--secondary" label="Secondary" />
              <ColorControl name="--secondary-foreground" label="Secondary Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Accent Colors">
            <div className="space-y-1">
              <ColorControl name="--accent" label="Accent" />
              <ColorControl name="--accent-foreground" label="Accent Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Base Colors">
            <div className="space-y-1">
              <ColorControl name="--background" label="Background" />
              <ColorControl name="--foreground" label="Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Card Colors">
            <div className="space-y-1">
              <ColorControl name="--card" label="Card" />
              <ColorControl name="--card-foreground" label="Card Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Popover Colors">
            <div className="space-y-1">
              <ColorControl name="--popover" label="Popover" />
              <ColorControl name="--popover-foreground" label="Popover Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Muted Colors">
            <div className="space-y-1">
              <ColorControl name="--muted" label="Muted" />
              <ColorControl name="--muted-foreground" label="Muted Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Destructive Colors">
            <div className="space-y-1">
              <ColorControl name="--destructive" label="Destructive" />
              <ColorControl name="--destructive-foreground" label="Destructive Foreground" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Border & Input Colors">
            <div className="space-y-1">
              <ColorControl name="--border" label="Border" />
              <ColorControl name="--input" label="Input" />
              <ColorControl name="--ring" label="Ring" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Chart Colors">
            <div className="space-y-1">
              <ColorControl name="--chart-1" label="Chart 1" />
              <ColorControl name="--chart-2" label="Chart 2" />
              <ColorControl name="--chart-3" label="Chart 3" />
              <ColorControl name="--chart-4" label="Chart 4" />
              <ColorControl name="--chart-5" label="Chart 5" />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Radius">
            <RadiusSection />
          </CollapsibleSection>

          <CollapsibleSection title="Spacing">
            <SpacingSection />
          </CollapsibleSection>

          <CollapsibleSection title="Shadow">
            <ShadowSection />
          </CollapsibleSection>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 overflow-y-auto h-screen">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Component Preview</h2>
              <p className="text-muted-foreground">
                See how your design tokens look in real components
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Buttons */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Buttons</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Primary Button
                  </button>
                  <button className="w-full px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Secondary Button
                  </button>
                  <button className="w-full px-4 py-2 bg-destructive text-destructive-foreground font-medium rounded-lg hover:opacity-90 transition-opacity">
                    Destructive Button
                  </button>
                </div>
              </div>

              {/* Cards */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Cards</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-background border border-border rounded-lg">
                    <p className="text-sm text-foreground">Background Card</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Muted Card</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-sm text-accent-foreground">Accent Card</p>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Form Inputs</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter text..."
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Focused state"
                    className="w-full px-3 py-2 bg-background border border-ring rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Typography */}
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-card-foreground mb-4">Typography</h3>
                <div className="space-y-2">
                  <p className="text-foreground font-semibold">Foreground Text</p>
                  <p className="text-muted-foreground">Muted Foreground</p>
                  <p className="text-card-foreground text-sm">Card Foreground</p>
                </div>
              </div>
            </div>

            {/* Large Preview Card */}
            <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-card-foreground mb-2">
                    Dashboard Overview
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your emergency response dashboard displays real-time data
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-chart-1/10 rounded-lg border border-border">
                      <p className="text-2xl font-bold text-chart-1">342</p>
                      <p className="text-xs text-muted-foreground mt-1">Total Calls</p>
                    </div>
                    <div className="p-4 bg-chart-3/10 rounded-lg border border-border">
                      <p className="text-2xl font-bold text-chart-3">12</p>
                      <p className="text-xs text-muted-foreground mt-1">AI Agents</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg border border-border">
                      <p className="text-2xl font-bold text-primary">98%</p>
                      <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:opacity-90">
                      Export Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
