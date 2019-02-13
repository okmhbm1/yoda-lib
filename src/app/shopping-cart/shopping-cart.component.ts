import { Component, OnInit, ComponentRef, ViewChild, TemplateRef } from '@angular/core';
import { mockData, MockData } from '../MOCK2_DATA';
import { of, Observable, Subject } from 'rxjs';
import { YodaFloatService } from 'projects/yoda-float/src/public_api';
import { YodaTableOptions, YodaTableField, YodaTablePage, YodaTableComponent } from 'projects/yoda-table/src/public_api';
import { YodaTableTemplateCol, YodaTableTemplateRow, YodaTableRowInfo } from 'projects/yoda-table/src/lib/yoda-table.component';
import { YodaListOptions, YodaListComponent } from 'projects/yoda-list/src/public_api';
import { debounceTime, distinctUntilChanged, map, switchMap, delay } from 'rxjs/operators';
import { YodaFormComponent, YodaFormOptions } from 'projects/yoda-form/src/public_api';
import { Validators } from '@angular/forms';
import { YodaFormField, YodaFormFieldRow, YodaFormType } from './../../../projects/yoda-form/src/lib/yoda-form.component';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {
  @ViewChild('testTemplate') testTempRef: TemplateRef<any>;
  @ViewChild('imgTemplate') imgTempRef: TemplateRef<any>;
  @ViewChild('imgsTemplate') imgsTempRef: TemplateRef<any>;
  @ViewChild('lastLineTemplate') lastTempRef: TemplateRef<any>;
  @ViewChild('lastLineTemplate2') last2TempRef: TemplateRef<any>;

  pageNum: number;
  putdata: [];
  ref: ComponentRef<YodaFormComponent>;
  options: YodaFormOptions;

  listOptions: YodaListOptions;
  listRef: ComponentRef<YodaListComponent>;
  searchText: string;
  optionTestSubject = new Subject<{ value: any, text: string }[]>();


  yodaTableOptions: YodaTableOptions;
  tableRef: ComponentRef<YodaTableComponent>;

  cart: MockData[];
  constructor(private yodaFloatService: YodaFloatService) { }

  ngOnInit() {
    this.initMockData();
    this.initForm();
  }

  initMockData() {
    this.cart = [];
    const fields = Object.keys(mockData[0]).map(key => {
      const field: YodaTableField = {
        title: key,
        name: key
      };
      return field;
    });
    fields.push({
      title: 'action',
      name: 'actions',
      align: 'center',
      actions: [{
        type: 'button',
        label: '담기',
        id: 'putdata',
        color: 'success',
        onAction: (id: string, dataRow: any) => {
          this.cart.push(dataRow);
          this.refreshForm();
        },
      },
      ]
    });
    this.yodaTableOptions = {
      fields: fields,
      pageSize: 5,
      asyncPaging: (pageNum: number, pageSize: number) => {
        this.pageNum = pageNum;
        const start = (pageNum - 1) * pageSize;
        let filteredData = mockData;
        if (this.searchText) {
          const searchText = this.searchText.toLowerCase().trim();
          filteredData = mockData.filter(data =>
            ['name'].reduce((prev, it) => {
              if (prev) {
                return prev;
              }
              return data[it] && (data[it].toLowerCase().indexOf(searchText) >= 0);
            }, false)
          );
        }
        const page: YodaTablePage = {
          total: filteredData.length,
          data: filteredData.slice(start, start + pageSize).map(data => {
            return data;
          })
        };
        return of(page).pipe(
          delay(200)
        );
      }
    };

    this.listOptions = {
      title: '상품담기만들기',
      onSearch: (text: string) => {
        this.searchText = text;
        this.reloadTable();
      },
      disableExport: false,
      filters: [
      ],
      buttons: [{
        label: 'form',
        id: 'form',
        color: 'success',
        onClick: () => {
          this.onNewForm();
        }
      }],
      tableOptions: this.yodaTableOptions
    };
    this.listRef = this.yodaFloatService.addComponent(YodaListComponent);
    this.listRef.instance.setOptions(this.listOptions);
  }

  reloadTable() {
    if (this.listRef && this.listRef.instance) {
      this.listRef.instance.reloadTable();
    }
  }

  onNewForm() {
    if (this.ref) {
      this.ref.destroy();
      this.ref = null;
      return;
    }

    this.initForm();
  }

  buildFormOption() {
    const fields: YodaFormFieldRow[] = this.cart.map((item, index) => {
      const col: YodaFormField[] = [{
        title: `name`,
        name: `name-${index}`,
        type: 'text',
        value: item.name,
      },
      {
        title: `price`,
        name: `price-${index}`,
        type: 'decimal',
        value: item.price
      }, {
        type: 'button',
        title: '삭제',
        name: `${index}`,
        onClick: (name: string) => {
          this.cart.splice(Number(name), 1);
          this.refreshForm();
        }
      }
      ];
      return {
        type: 'row' as YodaFormType,
        columns: col
      };
    });


    this.options = {
      title: '담은상품',
      fields: fields,
      onValueChanged: (value) => {
        console.log(value);
      },
      onAction: (action: string, data: any) => {
        console.log(data);
        this.ref.destroy();
        this.ref = null;
      }
    };
  }

  refreshForm() {
    if (this.ref) {
      this.ref.destroy();
      this.ref = null;
    }
    this.initForm();
  }

  initForm() {
    this.buildFormOption();
    console.log('form inited');
      console.log('add form component');
      this.ref = this.yodaFloatService.addComponent(YodaFormComponent);
      this.ref.instance.setOptions(this.options);
  }

}
