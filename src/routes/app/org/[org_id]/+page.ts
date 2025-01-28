import { api } from "$lib/api";

export const ssr = false;

export const load = async ({params}) => {

    return {
        projects: await api.getOrganizationProjects(params.org_id),
    };
}