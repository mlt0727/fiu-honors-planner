export type Item={id:string;title:string;category:number;canonical:string;summary:string;description:string;sourceUrl:string;mode:string;semester:string;sourceIssue:string|null;sourceCheckedAt:string};
export type Event={id:string;title:string;itemIds:string[];category:number;summary:string;start:string;end:string|null;location:string;deadline:string|null;sourceUrl:string;sourceCheckedAt:string;sourceNote?:string;alternateUrls?:string[];creditVerified?:boolean};
export type Status='none'|'planned'|'attended'|'accepted'|'dismissed';
export type RecordEntry={itemId:string;eventKey:string;category:number;status:Status;note:string;date:string;revision:number};
export type Preferences={hours:number;weekly:boolean;deadlineReminders:boolean;eventFallback:boolean;email:string;revision:number};
export type Draft={key:string;subject:string;body:string;to:string;reason:string;createdAt:string};
export type PlannerState={records:RecordEntry[];preferences:Preferences;drafts:Draft[];session:{email:string;verified:boolean}|null;sync:{lastSuccess:string|null;lastAttempt:string|null;error:string|null}};
