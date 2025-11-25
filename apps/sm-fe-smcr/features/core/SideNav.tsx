// "use client";

// import authClient from "@/lib/auth-client";
// import {
//   cn,
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@repo/ui";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import Link from "next/link";
// import { Fragment, useState } from "react";
// import { NavItems } from "../../settings/NavItems";

// const isUserOnFeature = (
//   userTeams: Array<{ name: string }>,
//   featureTeams: Array<string>
// ): boolean => {
//   return userTeams.some((userTeams) => featureTeams.includes(userTeams.name));
// };

// const SideNav = () => {
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
//   const navItems = NavItems();
//   const toggleSidebar = () => {
//     setIsSidebarExpanded(!isSidebarExpanded);
//   };
//   const { data: session } = authClient.useSession();

//   return (
//     <div
//       className={cn(
//         isSidebarExpanded ? "w-[200px]" : "w-[68px]",
//         "border-r transition-all duration-300 ease-in-out transform hidden sm:flex h-full bg-accent"
//       )}
//     >
//       <aside className="flex h-full flex-col w-full break-words px-4 overflow-x-hidden columns-1">
//         {/* Top */}
//         <div className="mt-4 relative pb-2">
//           <div className="flex flex-col space-y-1">
//             {navItems.map((item, idx) => {
//               if (session && (item.isPublic || item.teams)) {
//                 const isAuthorized = item.isPublic
//                   ? true
//                   : isUserOnFeature(session.user.teams, item.teams);

//                 if (item.position === "top" && isAuthorized) {
//                   return (
//                     <Fragment key={idx}>
//                       <div className="space-y-1">
//                         <SideNavItem
//                           name={item.name}
//                           label={item.label}
//                           icon={item.icon}
//                           path={item.href}
//                           active={item.active}
//                           isSidebarExpanded={isSidebarExpanded}
//                         />
//                       </div>
//                     </Fragment>
//                   );
//                 }
//               }
//             })}
//           </div>
//         </div>
//         {/* Bottom */}
//         <div className="sticky bottom-0 mt-auto whitespace-nowrap mb-4 transition duration-200 block">
//           {navItems.map((item, idx) => {
//             if (item.teams && session) {
//               const isAuthorized = isUserOnFeature(
//                 session.user.teams,
//                 item.teams
//               );
//               if (item.position === "bottom" && isAuthorized) {
//                 return (
//                   <Fragment key={idx}>
//                     <div className="space-y-1">
//                       <SideNavItem
//                         name={item.name}
//                         label={item.label}
//                         icon={item.icon}
//                         path={item.href}
//                         active={item.active}
//                         isSidebarExpanded={isSidebarExpanded}
//                       />
//                     </div>
//                   </Fragment>
//                 );
//               }
//             }
//           })}
//         </div>
//       </aside>
//       <div className="mt-[calc(calc(90vh)-40px)] relative">
//         <button
//           type="button"
//           className="absolute bottom-32 right-[-12px] flex h-6 w-6 items-center justify-center border border-muted-foreground/20 rounded-full bg-accent shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
//           onClick={toggleSidebar}
//         >
//           {isSidebarExpanded ? (
//             <ChevronLeft size={16} className="stroke-foreground" />
//           ) : (
//             <ChevronRight size={16} className="stroke-foreground" />
//           )}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default SideNav;

// export const SideNavItem: React.FC<{
//   name: string;
//   label: string;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   icon: any;
//   path: string;
//   active: boolean;
//   isSidebarExpanded: boolean;
// }> = ({ name, label, icon, path, active, isSidebarExpanded }) => {
//   console.log(label);
//   return (
//     <>
//       {isSidebarExpanded ? (
//         <Link
//           href={path}
//           className={`h-full relative flex items-center whitespace-nowrap rounded-md ${
//             active
//               ? "font-base text-sm bg-neutral-200 shadow-sm text-neutral-700 dark:bg-neutral-800 dark:text-white"
//               : "hover:bg-neutral-200 hover:text-neutral-700 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
//           }`}
//         >
//           <div className="relative font-base text-sm py-1.5 px-2 flex flex-row items-center space-x-2 rounded-md duration-100">
//             {icon}
//             <span>{name}</span>
//           </div>
//         </Link>
//       ) : (
//         <TooltipProvider delayDuration={70}>
//           <Tooltip>
//             <TooltipTrigger>
//               <Link
//                 href={path}
//                 className={`h-full relative flex items-center whitespace-nowrap rounded-md ${
//                   active
//                     ? "font-base text-sm bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-white"
//                     : "hover:bg-neutral-200 hover:text-neutral-700 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
//                 }`}
//               >
//                 <div className="relative font-base text-sm p-2 flex flex-row items-center space-x-2 rounded-md duration-100">
//                   {icon}
//                 </div>
//               </Link>
//             </TooltipTrigger>
//             <TooltipContent
//               side="left"
//               className="px-3 py-1.5 text-xs"
//               sideOffset={10}
//             >
//               <span>{label}</span>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//       )}
//     </>
//   );
// };
