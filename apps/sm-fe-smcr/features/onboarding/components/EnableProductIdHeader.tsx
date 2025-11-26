import { useFormContext } from "../context/FormContext";

export function EnableProductIdHeader() {
  const { stepFourData } = useFormContext();
  return (
    <>
      {stepFourData.productId && (
        <div className="font-bold text-white text-center">Id</div>
      )}
    </>
  );
}
