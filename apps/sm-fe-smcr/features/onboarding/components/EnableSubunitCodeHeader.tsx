import { useFormContext } from "../context/FormContext";

export function EnableSubunitCodeHeader() {
  const { stepFourData, formData } = useFormContext();
  return (
    <>
      {(stepFourData.subunitCode || formData.subunitCode) && (
        <div className="font-bold text-white text-center">Codice Univoco</div>
      )}
    </>
  );
}
