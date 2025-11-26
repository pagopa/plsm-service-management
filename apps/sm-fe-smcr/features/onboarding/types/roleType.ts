type RoleManager = {
  tag: "manager";
  value: string;
};
type RoleOperator = {
  tag: "operator";
  value: string;
};
type RoleUser = {
  tag: "user";
  value: string;
};
type RoleDelegate = {
  tag: "delegate";
  value: string;
};
type RoleSubDelegate = {
  tag: "subdelegate";
  value: string;
};
export type RoleOptions = Array<
  RoleManager | RoleOperator | RoleUser | RoleDelegate | RoleSubDelegate
>;
