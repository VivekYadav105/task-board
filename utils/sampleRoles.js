const owner_role = {
    name:"owner",
    description:"This is the owner role for organization",
    role_create:true,
    role_edit:true,
    role_delete:true,
    task_create:true,
    task_view:true,
    task_status_update:true,
    task_edit:true,
    task_assign:true,
    task_delete:true,
    user_assign:true,
    user_add:true,
    user_remove:true,
    org_create:true,
    org_update:true,
    org_delete:true,
    org_view:true,
    promotion_privilege:100
}

module.exports = {owner_role}