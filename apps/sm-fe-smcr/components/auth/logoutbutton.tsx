"use client";

export const LogoutButton = () => {
  const handleLogout = () => {
    window.location.assign("/api/auth/logout");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center gap-2 bg-white text-[#5E5E5E] border border-[#8C8C8C] rounded-md px-4 py-2 hover:bg-[#F5F5F5] transition-colors"
    >
      Logout
    </button>
  );
};
