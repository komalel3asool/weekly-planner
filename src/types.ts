export type Day="Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday"
export type ListSection="done"|"todos"|"meetings"|"results"
export interface DailyHabit{name:string;target:number;counts:Record<Day,number>}
export interface WeeklyHabit{name:string;target:number;count:number}
export interface WeekData{lists:Record<ListSection,Record<Day,string[]>>;daily:DailyHabit[];weekly:WeeklyHabit[];shopping:string[];focus:string}
