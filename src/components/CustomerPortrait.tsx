import { useEffect, useState } from "react";
import { Customer } from "../data/config";
import sheet from "../assets/customers.png";

const slots: Record<Customer["kind"], number> = {
  worker: 0,
  critic: 25,
  cilantroFan: 50,
  cilantroHater: 75,
  chiliFan: 100,
};

export default function CustomerPortrait({
  customer,
  angry,
  happy = false,
}: {
  customer: Customer;
  angry: boolean;
  happy?: boolean;
}) {
  const [speaking, setSpeaking] = useState(true);
  useEffect(() => {
    setSpeaking(true);
    const timer = window.setTimeout(() => setSpeaking(false), 2200);
    return () => window.clearTimeout(timer);
  }, [customer.kind]);
  return (
    <div
      className={`customer-figure ${happy ? "happy" : angry ? "impatient" : speaking ? "speaking" : "waiting"}`}
      role="img"
      aria-label={customer.name}
    >
      <div
        className="customer-art"
        style={{
          backgroundImage: `url(${sheet})`,
          backgroundPosition: `${slots[customer.kind]}% 50%`,
        }}
      />
    </div>
  );
}
