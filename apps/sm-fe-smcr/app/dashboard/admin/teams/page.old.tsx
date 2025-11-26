// "use client";
// import MembersTableWrapper from "@/components/admin/members-table-wrapper";
// import AddUserToTeam from "@/components/admin/teams/add-user-team";
// import CreateTeam from "@/components/admin/teams/create-team";
// import { getTeams } from "@/lib/actions/team.action";
// import { getUser, getUsers, getUserTeams } from "@/lib/actions/user.action";
// import { Team } from "@/lib/types/team";
// import { User } from "@/lib/types/user";
// import {
//   Breadcrumb,
//   BreadcrumbItem,
//   BreadcrumbList,
//   BreadcrumbPage,
//   BreadcrumbSeparator,
//   Button,
//   Checkbox,
//   Input,
//   Label,
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
//   Separator,
//   SidebarTrigger,
// } from "@repo/ui";
// import { FilterIcon } from "lucide-react";
// import { useEffect, useState } from "react";

// export default function Page() {
//   const [teams, setTeams] = useState<Team[]>([]);
//   const [users, setUsers] = useState<(User & { teams: Team[] })[]>([]); // Ogni utente avrà un array di teams
//   const [userlist, setUserList] = useState<User[]>([]);
//   const [teamsLoaded, setTeamsLoaded] = useState<boolean>(false); // Aggiunto stato per sapere se i team sono stati caricati

//   const [loading, setLoading] = useState<boolean>(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setTeams(await getTeams());
//         await getUser(setUsers);
//         await getUsers(setUserList);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (!teamsLoaded && users.length > 0) {
//       const fetchUserTeams = async () => {
//         const updatedUsers = await Promise.all(
//           users.map(async (user) => {
//             const userTeams = await getUserTeams(user.id);
//             return {
//               ...user,
//               teams: userTeams, // Aggiungi i team all'utente
//             };
//           }),
//         );
//         setUsers(updatedUsers);
//         setTeamsLoaded(true);
//       };
//       fetchUserTeams();
//     }
//   }, [users, teamsLoaded]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="w-full flex flex-col gap-4">
//       <header className="flex h-16 shrink-0 items-center border-b border-border gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
//         <div className="flex items-center gap-2 px-4">
//           <SidebarTrigger className="size-4" />

//           <div className="bg-muted w-px h-4">
//             <Separator orientation="vertical" className="mr-2 h-4" />
//           </div>

//           <Breadcrumb>
//             <BreadcrumbList>
//               <BreadcrumbItem className="hidden md:block">
//                 Dashboard
//               </BreadcrumbItem>
//               <BreadcrumbSeparator className="hidden md:block" />
//               <BreadcrumbItem>
//                 <BreadcrumbPage>Teams</BreadcrumbPage>
//               </BreadcrumbItem>
//             </BreadcrumbList>
//           </Breadcrumb>
//         </div>
//       </header>

//       <div className="inline-flex justify-between items-center px-4">
//         <div className="inline-flex items-center gap-2">
//           <Input placeholder="Search by name or email" className="w-64" />

//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="outline">
//                 <FilterIcon
//                   className="-ms-1 opacity-60"
//                   size={16}
//                   aria-hidden="true"
//                 />
//                 Teams
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-auto min-w-36 p-3" align="start">
//               <div className="space-y-3">
//                 <div className="text-muted-foreground text-xs font-medium">
//                   Filters
//                 </div>
//                 <div className="space-y-3">
//                   <div className="flex items-center gap-2">
//                     <Checkbox id="1" />
//                     <Label
//                       htmlFor="1"
//                       className="flex grow justify-between gap-2 font-normal"
//                     >
//                       Account
//                     </Label>
//                   </div>
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         </div>

//         <CreateTeam />
//       </div>
//       {loading ? (
//         <div>Loading... teams</div>
//       ) : (
//         <>
//           <div className="container mx-auto px-4">
//             <MembersTableWrapper teams={teams} users={users} />
//           </div>
//           <div>
//             <AddUserToTeam users={userlist} teams={teams} />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
