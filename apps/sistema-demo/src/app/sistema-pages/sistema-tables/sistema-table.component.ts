import { Component } from '@angular/core';

@Component({
    templateUrl: 'sistema-table.component.html',
})
export class SistemaTableComponent {
    isDescending = false;
    sorted = false;
    data: {
        id: string;
        name: string;
        tags: string;
        shared: string;
        lastUpdate: string;
        size: string;
    }[] = [
        {
            id: '1',
            name: 'My_text_file.txt',
            tags: 'Bonjour, Occitania, França, Jenesepas',
            shared: '(AC) | (GD)',
            lastUpdate: '11/11/2011',
            size: '100 MB',
        },
        {
            id: '2',
            name: 'contract.pdf',
            tags: 'Occitania',
            shared: '(AC)',
            lastUpdate: '4/10/2020',
            size: '15 KB',
        },
        {
            id: '3',
            name: 'pelican-svgrepo-com.svg',
            tags: '',
            shared: '(EB)',
            lastUpdate: '12/31/2007',
            size: '100 bytes',
        },
        {
            id: '4',
            name: 'Channel #general - 2020-01-23 (UTC).htm',
            tags: '',
            shared: '(EB) | (MP) (NI) (AC) (GD) (+3)',
            lastUpdate: '4/10/2020',
            size: '234.54 TB',
        },
        {
            id: '5',
            name: 'Channel #big-important-things - 2020-01-23 (UTC).htm',
            tags: '',
            shared: '(EB)',
            lastUpdate: 'Today, 9:45 AM',
            size: '24.56 MB',
        },
        {
            id: '6',
            name: 'document.pdf',
            tags: '[França X]',
            shared: '(EB)',
            lastUpdate: 'Yesterday, 12:56 PM',
            size: '3.56 MB',
        },
    ];
    subHeader = 'Yesterday';
    code = `<pa-table columns="repeat(6, 1fr)">
    <pa-table-header>
        <pa-table-sortable-header-cell (sort)="sortBy($event)">Name</pa-table-sortable-header-cell>
        <pa-table-cell header>Tags</pa-table-cell>
        <pa-table-cell header>Shared with</pa-table-cell>
        <pa-table-cell header>Last updated</pa-table-cell>
        <pa-table-cell header>Size</pa-table-cell>
        <pa-table-cell-menu header></pa-table-cell-menu>
    </pa-table-header>
    <pa-table-row-header>Today</pa-table-row-header>
    <pa-table-row (click)="clickRow()" clickable>
        <pa-table-cell header>My_text_file.txt</pa-table-cell>
        <pa-table-cell>Bonjour, Occitania, França, Jenesepas</pa-table-cell>
        <pa-table-cell>(AC) | (GD)</pa-table-cell>
        <pa-table-cell>Today, 9:45 AM</pa-table-cell>
        <pa-table-cell>100 MB</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
    <pa-table-row>
        <pa-table-cell header>contract.pdf</pa-table-cell>
        <pa-table-cell>Occitania</pa-table-cell>
        <pa-table-cell>(AC)</pa-table-cell>
        <pa-table-cell>1/2/2010</pa-table-cell>
        <pa-table-cell>15 KB</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
    <pa-table-row>
        <pa-table-cell header>pelican-svgrepo-com.svg</pa-table-cell>
        <pa-table-cell></pa-table-cell>
        <pa-table-cell>(EB)</pa-table-cell>
        <pa-table-cell>12/31/2007</pa-table-cell>
        <pa-table-cell>100 bytes</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
    <pa-table-row-header>Yesterday</pa-table-row-header>
    <pa-table-row>
        <pa-table-cell header noWrap><span class="pa-ellipsis">Channel #general - 2020-01-23 (UTC).htm</span></pa-table-cell>
        <pa-table-cell></pa-table-cell>
        <pa-table-cell>(EB) | (MP) (NI) (AC) (GD) (+3)</pa-table-cell>
        <pa-table-cell>Yesterday, 12:56 PM</pa-table-cell>
        <pa-table-cell>234.54 TB</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
    <pa-table-row>
        <pa-table-cell header>\Channel #big-important-things - 2020-01-23 (UTC).htm</pa-table-cell>
        <pa-table-cell></pa-table-cell>
        <pa-table-cell>(EB)</pa-table-cell>
        <pa-table-cell>4/10/2020</pa-table-cell>
        <pa-table-cell>24.56 MB</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
    <pa-table-row>
        <pa-table-cell header>document.pdf</pa-table-cell>
        <pa-table-cell>[França X]</pa-table-cell>
        <pa-table-cell>(EB)</pa-table-cell>
        <pa-table-cell>11/11/2011</pa-table-cell>
        <pa-table-cell>3.56 MB</pa-table-cell>
        <pa-table-cell-menu>
            <pa-button icon="more-horizontal" aspect="basic" size="small" (click)="openMenu($event)">Menu button</pa-button>
        </pa-table-cell-menu>
    </pa-table-row>
</pa-table>`;

    rowSelected?: string;

    clickRow(id: string | number) {
        console.log('Row has been clicked');
        this.rowSelected = id === this.rowSelected ? '' : `${id}`;
    }

    openMenu($event: MouseEvent) {
        $event.preventDefault();
        $event.stopPropagation();
        console.log('Menu button has been clicked');
    }

    sortBy() {
        this.sorted = true;
        this.isDescending = !this.isDescending;
        if (this.isDescending) {
            this.subHeader = 'Yesterday';
            this.data.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
        } else {
            this.subHeader = 'Today';
            this.data.sort((a, b) => b.name.toLocaleLowerCase().localeCompare(a.name.toLocaleLowerCase()));
        }
    }
}
