import { useEffect } from "react";
import { formatEventFullDate } from "../lib/eventFormat";
import type { MapQuestIncident, NexudusEvent } from "../types";

export type Alert =
  | { kind: "traffic"; data: MapQuestIncident }
  | { kind: "event"; data: NexudusEvent };

export function AlertModal({ alert, onClose }: { alert: Alert | null; onClose: () => void }) {
  useEffect(() => {
    if (!alert) return;
    const id = setTimeout(onClose, 30000);
    return () => clearTimeout(id);
  }, [alert, onClose]);

  if (!alert) return null;

  return (
    <section className="modal fade alerts show" id="alertDetails" role="dialog" style={{ display: "block" }}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" aria-label="Close" onClick={onClose}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="container-fluid">
              <div className="row">
                <div className="col details">
                  {alert.kind === "traffic" ? (
                    <>
                      <h3 className={`type-${alert.data.type} severity-${alert.data.severity}`}>
                        <i />{alert.data.parameterizedDescription.roadName}
                      </h3>
                      <p>{alert.data.fullDesc}</p>
                      <p>Between: {alert.data.parameterizedDescription.crossRoad1}</p>
                    </>
                  ) : (
                    <>
                      <h3>{alert.data.Name}</h3>
                      <div>
                        <span className="time-start">{formatEventFullDate(alert.data.StartDate)}</span>
                        <span className="time-end">{formatEventFullDate(alert.data.EndDate)}</span>
                      </div>
                      {alert.data.LongDescription && <div>{alert.data.LongDescription}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
