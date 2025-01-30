import { api } from "$lib/api";

export const ssr = false;

export const load = async ({params}) => {

    return {
        prompt: await api.getPrompt(params.org_id, params.project_id, params.prompt_id)
        };
}