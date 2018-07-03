export class ZoneFile {
    origin?: string;
    ttl?: number;
    soa: StartOfAuthority;
    ns?: NameServerRecord[];
    mx?: MailRecord[];
    a?: ARecord[];
    aaaa?: AaaaRecord[];
    cname?: CnameRecord[];
    srv?: SrvRecord[];
    txt?: TxtRecord[];
    spf?: SpfRecord[];
    uri?: URIRecord[];
    ptr?: PtrRecord[];
}

class Value {
    value: string;
    line?: number;
    startChar?: number;
    endChar?: number;
}

export class StartOfAuthority {
    name: string;
    minimum: number;
    expire: number;
    retry: number;
    refresh: number;
    serial: number;
    rname: string;
    mname: string;
    ttl?: number;
}

export class NameServerRecord {
    name: Value;
    host: Value;
    ttl?: number;
}

export class MailRecord {
    name: Value;
    host: Value;
    preference: number;
    ttl?: number;
}

export class ARecord {
    name: Value;
    ipAddress: Value;
    ttl?: number;
}

export class AaaaRecord {
    name: Value;
    ipAddress: Value;
    ttl?: number;
}

export class CnameRecord {
    name: Value;
    alias: Value;
    ttl?: number;
}

export class SrvRecord {
    name: Value;
    target: Value;
    priority: number;
    weight: number;
    port: number;
    ttl?: number;
}

export class TxtRecord {
    name: Value;
    txt: Value;
    ttl?: number;
}

export class SpfRecord {
    name: Value;
    data: Value;
    ttl?: number;
}

export class URIRecord {
    name: Value;
    target: Value;
    priority: number;
    weight: number;
    ttl?: number;
}

export class PtrRecord {
    name: Value;
    fullname: Value;
    host: Value;
    ttl?: number;
}