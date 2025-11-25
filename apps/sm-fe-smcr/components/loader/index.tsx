export const Loader = ({ text }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
      <div className="loader"></div>
      {text && (
        <span className="ml-4 text-lg font-medium text-gray-700">{text}</span>
      )}
    </div>
  );
};
