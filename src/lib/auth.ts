import { supabase } from './supabase'
export async function signUp(e:string,p:string){return await supabase.auth.signUp({email:e,password:p})}
export async function signIn(e:string,p:string){return await supabase.auth.signInWithPassword({email:e,password:p})}
export async function signOut(){return await supabase.auth.signOut()}
export async function getUser(){const {data}=await supabase.auth.getUser();return data.user}
