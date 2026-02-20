import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Location {
    latitude: number;
    longitude: number;
}
export interface ShopBranding {
    logo?: ExternalBlob;
    name?: string;
}
export type Time = bigint;
export type TextConstraint = {
    __kind__: "contains";
    contains: string;
} | {
    __kind__: "greaterThan";
    greaterThan: string;
} | {
    __kind__: "equals";
    equals: string;
} | {
    __kind__: "lessThan";
    lessThan: string;
};
export type IntConstraint = {
    __kind__: "greaterThan";
    greaterThan: bigint;
} | {
    __kind__: "equals";
    equals: bigint;
} | {
    __kind__: "lessThan";
    lessThan: bigint;
};
export interface PartyVisitRecord {
    comment: string;
    paymentDate: Time;
    amount: bigint;
    nextPaymentDate?: Time;
    location?: Location;
}
export interface StaffAccount {
    boundPrincipal?: Principal;
    loginName: string;
    canViewAllRecords: boolean;
    isDisabled: boolean;
}
export interface UpgradeData {
    partyVisitRecords: Array<[PartyId, Array<PartyVisitRecord>]>;
    branding?: ShopBranding;
    parties: Array<[PartyId, Party]>;
}
export type LocationConstraint = {
    __kind__: "greaterLatitude";
    greaterLatitude: number;
} | {
    __kind__: "greaterLongitude";
    greaterLongitude: number;
} | {
    __kind__: "withinRadius";
    withinRadius: [number, number, number];
} | {
    __kind__: "lessLatitude";
    lessLatitude: number;
} | {
    __kind__: "lessLongitude";
    lessLongitude: number;
};
export type TimeConstraint = {
    __kind__: "after";
    after: Time;
} | {
    __kind__: "before";
    before: Time;
} | {
    __kind__: "equals";
    equals: Time;
};
export type PaymentId = string;
export interface PartyVisitRecordFilter {
    paymentDateFilter?: TimeConstraint;
    nextPaymentDateFilter?: TimeConstraint;
    commentFilter?: TextConstraint;
    locationFilter?: LocationConstraint;
    amountFilter?: IntConstraint;
}
export type PartyId = string;
export interface Party {
    id: PartyId;
    pan: string;
    name: string;
    address: string;
    phone: string;
    dueAmount: bigint;
}
export interface VisitRecordMetadata {
    paymentId: PaymentId;
    hasLocation: boolean;
    hasNextPaymentDate: boolean;
}
export interface AggregateVisitRecordMetadata {
    filteredPaymentsMetadata: Array<VisitRecordMetadata>;
    allPaymentsMetadata: Array<VisitRecordMetadata>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addParty(partyId: PartyId, name: string, address: string, phone: string, pan: string, dueAmount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticateStaff(loginName: string): Promise<boolean>;
    createStaffAccount(loginName: string, canViewAllRecords: boolean): Promise<void>;
    deleteParty(partyId: PartyId): Promise<void>;
    disableStaffAccount(loginName: string): Promise<void>;
    exportUpgradeData(): Promise<UpgradeData>;
    filterPartyVisitRecordMetadata(partyId: PartyId, _filter: PartyVisitRecordFilter): Promise<AggregateVisitRecordMetadata>;
    filterPartyVisitRecords(partyId: PartyId, _filter: PartyVisitRecordFilter): Promise<Array<[PaymentId, PartyVisitRecord]>>;
    getAllParties(): Promise<Array<[string, Party]>>;
    getCallerUserProfile(): Promise<{
        name: string;
    } | null>;
    getCallerUserRole(): Promise<UserRole>;
    getParty(_id: PartyId): Promise<{
        pan: string;
        name: string;
        address: string;
        phone: string;
        dueAmount: bigint;
    } | null>;
    getPartyIdTest(name: string, phone: string): Promise<string>;
    getPartyVisitRecordMetadata(partyId: PartyId): Promise<Array<VisitRecordMetadata>>;
    getPartyVisitRecords(partyId: PartyId): Promise<Array<[PaymentId, PartyVisitRecord]>>;
    getShopBranding(): Promise<ShopBranding | null>;
    getUserProfile(user: Principal): Promise<{
        name: string;
    } | null>;
    importUpgradeData(data: UpgradeData): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listStaffAccounts(): Promise<Array<StaffAccount>>;
    recordPartyVisit(partyId: PartyId, amount: bigint, comment: string, paymentDate: Time, nextPayment: Time | null, location: Location | null): Promise<string>;
    recordPayment(partyId: PartyId, amount: bigint, comment: string, paymentDate: Time, nextPayment: Time | null): Promise<string>;
    saveCallerUserProfile(profile: {
        name: string;
    }): Promise<void>;
    setShopBranding(name: string | null, logo: ExternalBlob | null): Promise<void>;
    updateParty(partyId: PartyId, name: string, address: string, phoneNumber: string, pan: string, dueAmount: bigint): Promise<void>;
    updateStaffAccount(loginName: string, canViewAllRecords: boolean | null, isDisabled: boolean | null): Promise<void>;
    validateAndGenerateNewPartyId(name: string, phone: string): Promise<string>;
}
