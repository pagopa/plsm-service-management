// "use client";

// import { createUser } from "@/lib/actions/user.action";
// import { Button, Input, Label } from "@repo/ui";
// import { PlusIcon, LoaderCircleIcon } from "lucide-react";
// import React, { useActionState } from "react";

// export default function CreateUserForm() {
//   const [state, action, isPending] = useActionState(createUser, {
//     fields: {
//       firstName: "",
//       lastName: "",
//       email: "",
//       taxCode: "",
//       productRole: "",
//       role: "",
//       roleLabel: "",
//     },
//   });

//   return (
//     <div>
//       <form action={action} className="flex flex-col gap-4">
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="firstName">Nome</Label>
//             <Input
//               id="firstName"
//               name="firstName"
//               placeholder="Mario"
//               defaultValue={(state?.fields.firstName as string) || ""}
//             />

//             {state?.errors?.firstName ? (
//               <Label className="text-destructive">
//                 {state.errors?.firstName}
//               </Label>
//             ) : null}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="lastName">Cognome</Label>
//             <Input
//               id="lastName"
//               name="lastName"
//               placeholder="Rossi"
//               defaultValue={(state?.fields.lastName as string) || ""}
//             />

//             {state?.errors?.lastName ? (
//               <Label className="text-destructive">
//                 {state.errors?.lastName}
//               </Label>
//             ) : null}
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="email">Email</Label>
//           <Input
//             id="email"
//             name="email"
//             type="email"
//             placeholder="mario@pagopa.it"
//             defaultValue={(state?.fields.email as string) || ""}
//           />

//           {state?.errors?.email ? (
//             <Label className="text-destructive">{state.errors?.email}</Label>
//           ) : null}
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="taxCode">Codice Fiscale</Label>
//           <Input
//             id="taxCode"
//             name="taxCode"
//             placeholder="Codice Fiscale"
//             defaultValue={(state?.fields.taxCode as string) || ""}
//           />

//           {state?.errors?.taxCode ? (
//             <Label className="text-destructive">{state.errors?.taxCode}</Label>
//           ) : null}
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="productRole">Product Role</Label>
//           <Input
//             id="productRole"
//             name="productRole"
//             placeholder="Product Role"
//             defaultValue={(state?.fields.productRole as string) || ""}
//           />

//           {state?.errors?.productRole ? (
//             <Label className="text-destructive">
//               {state.errors?.productRole}
//             </Label>
//           ) : null}
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-2">
//             <Label htmlFor="role">Role</Label>
//             <Input
//               id="role"
//               name="role"
//               placeholder="Role"
//               defaultValue={(state?.fields.role as string) || ""}
//             />

//             {state?.errors?.role ? (
//               <Label className="text-destructive">{state.errors?.role}</Label>
//             ) : null}
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="roleLabel">Role Label</Label>
//             <Input
//               id="roleLabel"
//               name="roleLabel"
//               placeholder="Role Label"
//               defaultValue={(state?.fields.roleLabel as string) || ""}
//             />

//             {state?.errors?.roleLabel ? (
//               <Label className="text-destructive">
//                 {state.errors?.roleLabel}
//               </Label>
//             ) : null}
//           </div>
//         </div>

//         <div className="w-full inline-flex items-center justify-end">
//           <Button size="sm" type="submit" disabled={isPending}>
//             {isPending ? (
//               <LoaderCircleIcon
//                 className="animate-spin size-3.5 -ms-1 opacity-60"
//                 aria-hidden="true"
//               />
//             ) : (
//               <PlusIcon
//                 className="size-3.5 -ms-1 opacity-60"
//                 aria-hidden="true"
//               />
//             )}
//             Salva
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }
