import { businesses } from "../data/businesses";
import { ScrollList } from "./ScrollList";
import type { Business } from "../types";

function Logo({ b }: { b: Business }) {
  if (b.logo1) {
    return (
      <div className="logo">
        <img src={`/img/logos/${b.logo1}`} alt={b.company} />
        {b.logo2 && <img src={`/img/logos/${b.logo2}`} alt={b.company2} />}
      </div>
    );
  }
  return <div className="logo"><h3>{b.company || "Space Available!"}</h3></div>;
}

export function DirectoryPanel({ onSelectSuite }: { onSelectSuite: (id: string) => void }) {
  return (
    <section id="directory" className="col">
      <h2>Company Directory</h2>
      <ScrollList>
        {businesses.map((b) => (
          <li key={b.suite} id={b.suite} onClick={() => onSelectSuite(b.suite)}>
            <Logo b={b} />
            <div className="location">
              <span className="type">Suite</span>
              <span className="num">{b.suite}</span>
            </div>
          </li>
        ))}
      </ScrollList>
    </section>
  );
}
