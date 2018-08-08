'use strict';

import { ZoneFile, StartOfAuthority, NameServerRecord, ARecord, AaaaRecord, CnameRecord, MailRecord, TxtRecord, PtrRecord, SrvRecord, SpfRecord, URIRecord } from './types';

const MINUTES_IN_SECONDS = 60;
const HOURS_IN_SECONDS = MINUTES_IN_SECONDS * 60;
const DAYS_IN_SECONDS = HOURS_IN_SECONDS * 24;
const WEEKS_IN_SECONDS = DAYS_IN_SECONDS * 7;

let currentOrigin = '';
let currentTTL: number;

export function parseZoneFile(text: string) : ZoneFile {
    text = removeComments(text);
    text = flatten(text);
    return parseRRs(text);
}

function removeComments(text: string) : string {
    //let re = /(^|[^\\]);.*/g;
    let re = /;(?=([^\"]*\"[^\"]*\")*[^\"]*$).*(^|[^\\])/g;
    return text.replace(re, "");

    /*return text.replace(re, function(m, g1) {
        return g1 ? g1 : ""; // if g1 is set/matched, re-insert it, else remove
    });*/
}

function flatten(text: string) : string {
    let captured: RegExpExecArray[] = [];
    let re = /\([\s\S]*?\)/gim;
    let match = re.exec(text);
    let replacement: string;

    while (match != null) {
        replacement = match[0].replace(/\s+/gm, ' ');
        captured.push(match);
        // captured Text, index, input
        match = re.exec(text);
    }

    let arrText = text.split('');

    for (let i in captured) {
        match = captured[i];
        arrText.splice(match.index, match[0].length, replacement);
    }

    return arrText.join('').replace(/\(|\)/gim, ' ');
}

function parseTtl(ttl: string) : number {
    let ttlInSeconds: number = 0;

    if (!isNaN(Number(ttl))) {
        ttlInSeconds = parseInt(ttl, 10);
    } else if (isNaN(Number(ttl))) {
        let unit = ttl.substr(ttl.length - 1, 1).toUpperCase();
        let multiplier: number;

        if (unit === "S") {
            multiplier = 1;
        } else if (unit === "M") {
            multiplier = MINUTES_IN_SECONDS;
        } else if (unit === "H") {
            multiplier = HOURS_IN_SECONDS;
        } else if (unit === "D") {
            multiplier = DAYS_IN_SECONDS;
        } else if (unit === "W") {
            multiplier = WEEKS_IN_SECONDS;
        } else {
            multiplier = -1;
        }

        if (multiplier !== -1 && ttl !== "NS") {
            ttlInSeconds = parseInt(ttl.substr(0, ttl.length-1), 10) * multiplier;
        } else if (currentTTL != null) {
            ttlInSeconds = currentTTL;
        }
    }

    return ttlInSeconds;
}

function parseRRs(text: string) : ZoneFile {
    let ret = new ZoneFile();
    let rrs = text.split('\n');

    for (let i in rrs) {
        let rr = rrs[i];

        if (!rr || !rr.trim()) {
            continue;
        }

        let uRR = rr.toUpperCase();

        if (/\s+TXT\s+/.test(uRR)) {
            ret.txt = ret.txt || [];
            ret.txt.push(parseTXT(rr));
        } else if (uRR.indexOf('$ORIGIN') === 0) {
            if (ret.origin == null) {
                ret.origin = rr.split(/\s+/g)[1];
                currentOrigin = ret.origin;
            } else {
                currentOrigin = rr.split(/\s+/g)[1];
            }
        } else if (uRR.indexOf('$TTL') === 0) {
            if (ret.ttl == null) {
                ret.ttl = parseInt(rr.split(/\s+/g)[1], 10);
                currentTTL = ret.ttl;
            } else {
                currentTTL = parseInt(rr.split(/\s+/g)[1], 10);
            }
        } else if (/\s+SOA\s+/.test(uRR)) {
            ret.soa = parseSOA(rr, ret);

            if (ret.soa.name !== '@') {
                ret.origin = ret.soa.name + '.';
            }
        } else if (/\s+NS\s+/.test(uRR)) {
            ret.ns = ret.ns || [];
            ret.ns.push(parseNS(rr));
        } else if (/\s+SPF\s+/.test(uRR)) {
            ret.spf = ret.spf || [];
            ret.spf.push(parseSPF(rr));
        } else if (/\s+A\s+/.test(uRR)) {
            ret.a = ret.a || [];
            ret.a.push(parseA(rr, ret.a));
        } else if (/\s+AAAA\s+/.test(uRR)) {
            ret.aaaa = ret.aaaa || [];
            ret.aaaa.push(parseAAAA(rr));
        } else if (/\s+CNAME\s+/.test(uRR)) {
            ret.cname = ret.cname || [];
            ret.cname.push(parseCNAME(rr));
        } else if (/\s+MX\s+/.test(uRR)) {
            ret.mx = ret.mx || [];
            ret.mx.push(parseMX(rr));
        } else if (/\s+PTR\s+/.test(uRR)) {
            ret.ptr = ret.ptr || [];
            ret.ptr.push(parsePTR(rr, ret.ptr, ret.origin));
        } else if (/\s+SRV\s+/.test(uRR)) {
            ret.srv = ret.srv || [];
            ret.srv.push(parseSRV(rr));
        } else if (/\s+URI\s+/.test(uRR)) {
            ret.uri = ret.uri || [];
            ret.uri.push(parseURI(rr));
        } else {
            console.log("Unhandled line: " + rr);
        }
    }

    return ret;
}

function parseSOA(rr: string, zoneFile: ZoneFile) : StartOfAuthority {
    let soa = new StartOfAuthority();
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;

    soa.name = rrTokens[0];
    soa.minimum = parseTtl(rrTokens[l - 1]);
    soa.expire = parseTtl(rrTokens[l - 2]);
    soa.retry = parseTtl(rrTokens[l - 3]);
    soa.refresh = parseTtl(rrTokens[l - 4]);
    soa.serial = parseInt(rrTokens[l - 5], 10);
    soa.rname = rrTokens[l - 6];
    soa.mname = rrTokens[l - 7];
    soa.ttl = parseTtl(rrTokens[1]);

    return soa;
}

function parseNS(rr: string) : NameServerRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let name: string;
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    if (rrTokens[0] === "NS" || !isNaN(Number(rrTokens[0]))) {
        name = "@";
    } else {
        name = rrTokens[0] + suffix;
    }

    let result: NameServerRecord = {
        name: {value: name},
        host: {value: rrTokens[l - 1]}
    };

    if (rrTokens[0] === name) {
        result.ttl = parseTtl(rrTokens[1]);
    } else {
        result.ttl = parseTtl(rrTokens[0]);
    }

    return result;
}

function parseMX(rr: string) : MailRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let name: string;
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    if (rrTokens[0] === "MX" || !isNaN(Number(rrTokens[0]))) {
        name = "@";
    } else {
        name = rrTokens[0] + suffix;
    }

    let result: MailRecord = {
        name: {value: name},
        preference: parseInt(rrTokens[l - 2], 10),
        host: {value: rrTokens[l - 1]}
    };

    if (rrTokens[0] === name) {
        result.ttl = parseTtl(rrTokens[1]);
    } else {
        result.ttl = parseTtl(rrTokens[0]);
    }

    return result;
}

function parseA(rr: string, recordsSoFar: ARecord[]) : ARecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let urrTokens = rr.trim().toUpperCase().split(/\s+/g);
    let l = rrTokens.length;
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    let result: ARecord = {
        name: {value: rrTokens[0] + suffix},
        ipAddress: {value: rrTokens[l - 1]}
    };

    if (urrTokens.lastIndexOf('A') === 0) {
        if (recordsSoFar.length) {
            result.name = recordsSoFar[recordsSoFar.length - 1].name;
        }
        else {
            result.name.value = '@';
        }
    }

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseAAAA(rr: string) : AaaaRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    let result: AaaaRecord = {
        name: {value: rrTokens[0] + suffix},
        ipAddress: {value: rrTokens[l - 1]}
    };

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseCNAME(rr: string) : CnameRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    let result: CnameRecord = {
        name: {value: rrTokens[0] + suffix},
        alias: {value: rrTokens[l - 1]}
    };

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseTXT(rr: string) : TxtRecord {
    let rrTokens = rr.trim().match(/[^\s\"']+|\"[^\"]*\"|'[^']*'/g);
    let l = rrTokens.length;
    let indexTXT = rrTokens.indexOf('TXT');
    let suffix: string;

    if (currentOrigin == null || currentOrigin === '.') {
        suffix = '';
    } else {
        suffix = "." + currentOrigin;
    }

    let stripText = function(txt) {
        if (txt.indexOf('\"') > -1) {
            txt = txt.split('\"')[1];
        }
        if (txt.indexOf('"') > -1) {
            txt = txt.split('"')[1];
        }
        return txt;
    };

    let name: string;
    let tokenTxt;

    if (l - indexTXT - 1 > 1) {
        tokenTxt = rrTokens
            .slice(indexTXT + 1)
            .map(stripText);
    } else {
        tokenTxt = stripText(rrTokens[l - 1]);
    }

    if (indexTXT === 0 || !isNaN(Number(rrTokens[0]))) {
        name = "@";
    } else {
        name = rrTokens[0] + suffix;
    }

    let result: TxtRecord = {
        name: {value: name},
        txt: {value: tokenTxt}
    };

    if (rrTokens[0] === name) {
        result.ttl = parseTtl(rrTokens[1]);
    } else {
        result.ttl = parseTtl(rrTokens[0]);
    }

    return result;
}

function parsePTR(rr: string, recordsSoFar: PtrRecord[], currentOrigin: string) : PtrRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let urrTokens = rr.trim().toUpperCase().split(/\s+/g);

    if (urrTokens.lastIndexOf('PTR') === 0 && recordsSoFar[recordsSoFar.length - 1]) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name.value);
    }

    let l = rrTokens.length;
    let result: PtrRecord = {
        name: {value: rrTokens[0]},
        fullname: {value: rrTokens[0] + '.' + currentOrigin},
        host: {value: rrTokens[l - 1]}
    };

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseSRV(rr: string) : SrvRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let result: SrvRecord = {
        name: {value: rrTokens[0]},
        target: {value: rrTokens[l - 1]},
        priority: parseInt(rrTokens[l - 4], 10),
        weight: parseInt(rrTokens[l - 3], 10),
        port: parseInt(rrTokens[l - 2], 10)
    };

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseSPF(rr: string) : SpfRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let result: SpfRecord = {
        name: {value: rrTokens[0]},
        data: {value: ''}
    };

    let l = rrTokens.length;
    while (l-- > 4) {
        result.data.value = rrTokens[l] + ' ' + result.data.value.trim();
    }

    result.ttl = parseTtl(rrTokens[1]);

    return result;
}

function parseURI(rr: string) : URIRecord {
    let rrTokens = rr.trim().split(/\s+/g);
    let l = rrTokens.length;
    let result: URIRecord = {
        name: {value: rrTokens[0]},
        target: {value: rrTokens[l - 1].replace(/"/g, '')},
        priority: parseInt(rrTokens[l - 3], 10),
        weight: parseInt(rrTokens[l - 2], 10)
    };

    result.ttl = parseTtl(rrTokens[1]);

   return result;
}