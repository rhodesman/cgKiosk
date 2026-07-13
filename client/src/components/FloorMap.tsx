const SUITES = [
  "s-200", "s-300", "s-400", "s-500", "s-600", "s-700", "s-800",
  "s-900", "s-900 a", "s-1000",
  "o-101", "o-102", "o-103", "o-104", "o-105", "o-106", "o-107",
];
const CONF = ["classroom", "event", "kitchen", "c-102"];

function isHighlighted(highlighted: string[], baseClass: string): boolean {
  // baseClass e.g. "suite s-700" -> selector ".suite.s-700"
  const selector = "." + baseClass.trim().split(/\s+/).join(".");
  return highlighted.includes(selector);
}

export function FloorMap({ highlighted }: { highlighted: string[] }) {
  return (
    <section id="map" className="col">
      <div id="cgMap">
        <div className="city-garage">
          <div className="are-here">You Are Here</div>
          {SUITES.map((s) => {
            const base = `suite ${s}`;
            const show = isHighlighted(highlighted, base) ? " show" : "";
            return <div key={s} className={`${base}${show}`} />;
          })}
          {CONF.map((c) => (
            <div key={c} className={`conf ${c}`} />
          ))}
          <div className="kitchen" />
          <div className="restrooms r-1" />
          <div className="restrooms r-2" />
        </div>
      </div>
    </section>
  );
}
