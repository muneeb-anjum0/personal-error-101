import { SectionHeading } from "@/components/ui/section-heading";

const principles = [
  "Build for actual problems",
  "Understand the entire system",
  "Automate repetitive work",
  "Measure before claiming improvement",
  "Keep learning"
];

export function PhilosophySection() {
  return (
    <section id="philosophy" className="portfolio-section philosophy-section">
      <SectionHeading label="06 / PHILOSOPHY" heading="CODE IS NOT THE PRODUCT." />
      <div className="philosophy-grid">
        <p>
          THE SYSTEM,
          <br />
          THE EXPERIENCE,
          <br />
          AND THE RESULT
          <br />
          ARE THE PRODUCT.
        </p>
        <ol>
          {principles.map((principle, index) => (
            <li key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {principle}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
