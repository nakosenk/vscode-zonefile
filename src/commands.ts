import { ZoneFile } from './parser/types';

export function formatZoneFile(zoneFile: ZoneFile) : string {
    let formattedZoneFile = [];
    let soa = [
        `$ORIGIN ${zoneFile.origin}`,
        `$TTL ${zoneFile.ttl}`,
        `@\t\t\tIN\tSOA\t${zoneFile.soa.mname} ${zoneFile.soa.rname} (`,
        `\t\t\t\t\t\t${zoneFile.soa.serial + 1}\t; Serial`,
        `\t\t\t\t\t\t${zoneFile.soa.refresh}\t\t; Refresh`,
        `\t\t\t\t\t\t${zoneFile.soa.retry}\t\t; Retry`,
        `\t\t\t\t\t\t${zoneFile.soa.expire}\t\t; Expire`,
        `\t\t\t\t\t\t${zoneFile.soa.minimum}\t\t; Minimum`,
        `\t\t\t\t\t)`
    ];

    formattedZoneFile.push(soa.join('\n'));

    let nsRecords = [ "\n;Name Servers" ];

    if (zoneFile.ns != null) {
        for (let ns of zoneFile.ns.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let record = `${ns.name.value}\t\t\tIN\tNS\t${ns.host.value}`;
            nsRecords.push(record);
        }
    }

    formattedZoneFile.push(nsRecords.join('\n'));

    let mxRecords = [ "\n;Mail Servers" ];

    if (zoneFile.mx != null) {
        for (let mx of zoneFile.mx.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let ttl = "\t";
            if (mx.ttl && mx.ttl !== zoneFile.ttl) {
                ttl = mx.ttl.toString();
            }

            let record = `${mx.name.value}\t${ttl}\tIN\tMX\t${mx.host.value}`;
            mxRecords.push(record);
        }
    }

    formattedZoneFile.push(mxRecords.join('\n'));

    let aRecords = [ "\n;A Records" ];

    if (zoneFile.a != null) {
        for (let a of zoneFile.a.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let ttl = "\t";
            if (a.ttl && a.ttl !== zoneFile.ttl) {
                ttl = a.ttl.toString();
            }

            let record = `${a.name.value.replace('.' + zoneFile.origin, '')}\t${ttl}\tIN\tA\t${a.ipAddress.value}`;
            aRecords.push(record);
        }
    }

    formattedZoneFile.push(aRecords.join('\n'));

    let aaaaRecords = [ "\n;AAAA Records" ];

    if (zoneFile.aaaa != null) {
        for (let aaaa of zoneFile.aaaa.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let ttl = "\t";
            if (aaaa.ttl && aaaa.ttl !== zoneFile.ttl) {
                ttl = aaaa.ttl.toString();
            }

            let record = `${aaaa.name.value}\t${ttl}\tIN\tAAAA\t${aaaa.ipAddress.value}`;
            aaaaRecords.push(record);
        }
    }

    formattedZoneFile.push(aaaaRecords.join('\n'));

    let cnameRecords = [ "\n;CNAME Records" ];

    if (zoneFile.cname != null) {
        for (let cname of zoneFile.cname.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let ttl = "\t";
            if (cname.ttl && cname.ttl !== zoneFile.ttl) {
                ttl = cname.ttl.toString();
            }

            let record = `${cname.name.value.replace('.' + zoneFile.origin, '')}\t${ttl}\tIN\tCNAME\t${cname.alias.value}`;
            cnameRecords.push(record);
        }
    }

    formattedZoneFile.push(cnameRecords.join('\n'));

    let srvRecords = [ "\n;SRV Records" ];

    if (zoneFile.srv != null) {
        for (let srv of zoneFile.srv.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let ttl = "\t";
            if (srv.ttl && srv.ttl !== zoneFile.ttl) {
                ttl = srv.ttl.toString();
            }

            let record = `${srv.name.value}\t${ttl}\tIN\tSRV\t${srv.target.value}`;
            srvRecords.push(record);
        }
    }

    formattedZoneFile.push(srvRecords.join('\n'));

    let txtRecords = [ "\n;TXT Records" ];

    if (zoneFile.txt != null) {
        for (let txt of zoneFile.txt.sort(function(a,b) {
            return a.name.value.localeCompare(b.name.value);
        })) {
            let value = txt.txt.value;
            let ttl = "\t";
            if (txt.ttl && txt.ttl !== zoneFile.ttl) {
                ttl = txt.ttl.toString();
            }


            if (txt.txt.value.indexOf(" ") !== -1) {
                value = "\"" + value + "\"";
            }

            let record = `${txt.name.value}\t${ttl}\tIN\tTXT\t${value}`;
            txtRecords.push(record);
        }
    }

    formattedZoneFile.push(txtRecords.join('\n'));

    return formattedZoneFile.join('\n');
}