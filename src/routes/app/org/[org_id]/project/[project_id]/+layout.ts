import { api } from "$lib/api";

export const ssr = false;

export const load = async ({params}) => {

    return {
        project: await api.getProject(params.org_id, params.project_id),
    };
}