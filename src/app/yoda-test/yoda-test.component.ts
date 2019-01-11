import { Component, OnInit, ComponentRef, ViewChild, TemplateRef } from '@angular/core';
import { mockData, testStates } from '../MOCK_DATA';
import { of, Observable, Subject } from 'rxjs';
import { YodaFloatService } from 'projects/yoda-float/src/public_api';
import { YodaTableOptions, YodaTableField, YodaTablePage, YodaTableComponent } from 'projects/yoda-table/src/public_api';
import { YodaTableTemplateCol, YodaTableTemplateRow } from '../../../projects/yoda-table/src/lib/yoda-table.component';
import { YodaListOptions, YodaListComponent } from 'projects/yoda-list/src/public_api';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { YodaFormComponent, YodaFormOptions } from 'projects/yoda-form/src/public_api';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-yoda-test',
  templateUrl: './yoda-test.component.html',
  styleUrls: ['./yoda-test.component.scss']
})
export class YodaTestComponent implements OnInit {
  @ViewChild('testTemplate') testTempRef: TemplateRef<any>;
  @ViewChild('imgTemplate') imgTempRef: TemplateRef<any>;
  @ViewChild('imgsTemplate') imgsTempRef: TemplateRef<any>;

  pageNum: number;
  imgSrcs: any[] = [];

  ref: ComponentRef<YodaFormComponent>;
  options: YodaFormOptions;

  listOptions: YodaListOptions;
  listRef: ComponentRef<YodaListComponent>;
  searchText: string;
  num: number;
  optionTestSubject = new Subject<{ value: any, text: string }[]>();

  cancelReq = true;

  yodaTableOptions: YodaTableOptions;
  tableRef: ComponentRef<YodaTableComponent>;
  imgSrc = 'http://media.pixcove.com/I/5/8/Image-Editing-Textures-Backgrounds-Unleashed-Ebv-W-8490.jpg';
  constructor(private yodaFloatService: YodaFloatService) { }

  ngOnInit() {
    this.initMockData();
    this.initForm();
  }

  initMockData() {
    const fields = Object.keys(mockData[0]).map(key => {
      const field: YodaTableField = {
        title: key,
        name: key
      };
      switch (key) {
        case 'avatar':
          field.formatter = (value: any, row: any) => {
            return `<img src="https://picsum.photos/64?image=${row.img}">`;
          };
          break;
      }
      return field;
    });
    fields.push({
      title: 'action',
      name: 'actions',
      actions: [{
        type: 'button',
        label: '확장',
        id: 'expand',
        color: 'success',
        onAction: (id: string, dataRow: any) => {
          dataRow.expand = true;
          this.listRef.instance.refreshState();
        },
        onState: (id: string, dataRow: any) => dataRow.expand ? 'hide' : 'enabled'
      },
      {
        type: 'button',
        label: '축소',
        id: 'collapse',
        color: 'info',
        onAction: (id: string, dataRow: any) => {
          dataRow.expand = false;
          this.listRef.instance.refreshState();
        },
        onState: (id: string, dataRow: any) => dataRow.expand ? 'enabled' : 'hide'
      }
      ]
    });
    this.yodaTableOptions = {
      fields: fields,
      pageSize: 5,
      onAdditionalRows: (rowData: any) => {
        const col: YodaTableTemplateCol = {
          colSpan: 5,
          template: this.testTempRef,
        };
        const col2: YodaTableTemplateCol = {
          colSpan: 5,
          template: this.imgTempRef
        };
        const row: YodaTableTemplateRow = {
          columns: [col, col2]
        };
        if (rowData.expand) {
          return [row, row];
        }
        return null;
      },
      asyncPaging: (pageNum: number, pageSize: number) => {
        this.pageNum = pageNum;
        const start = (pageNum - 1) * pageSize;
        const page: YodaTablePage = {
          total: mockData.length,
          data: mockData.slice(start, start + pageSize).map(data => {
            data.expand = false;
            data.img = Math.floor(Math.random() * 1000);
            return data;
          })
        };
        return of(page);
      }
    };

    this.listOptions = {
      title: '리스트 테스트',
      onSearch: (text: string) => {
        this.searchText = text;
        this.reloadTable();
      },
      disableExport: false,

      filters: [
        {
          label: '담당자',
          id: 'staff',
          type: 'typeahead',
          onTypeahead: (text$: Observable<string>) =>
            text$.pipe(
              debounceTime(200),
              distinctUntilChanged(),
              map(term => term.length < 2 ? []
                : testStates.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
            ),
          onFilter: (id: string, value: any) => {
            console.log(id + ' filter ' + value);
          },
        },
        {
          label: 'testSelect',
          id: 'select',
          type: 'select',
          options: [
            { value: '0', text: '0' },
            { value: '1', text: '1' },
            { value: '2', text: '2' },
          ],
          onFilter: (id: string, value: any) => {
            console.log(id + ' filter ' + value);
          },
          onState: (id: string) => 'disabled',
        },
        {
          label: 'dateStart',
          id: 'dateStart',
          type: 'date',
          value: new Date('2017-01-25'),
          onFilter: (id: string, value: any) => {
            console.log(id + ' filter ' + value);
          },
        }
      ],
      buttons: [{
        label: '취소요청 수락',
        id: 'acceptCancel',
        color: 'danger',
        onClick: _ => {
        },
        onState: _ => this.cancelReq ? 'enabled' : 'hide'
      }
      ],
      tableOptions: this.yodaTableOptions
    };
    console.log('list inited');
    setTimeout(() => {
      console.log('add list component');
      this.listRef = this.yodaFloatService.addComponent(YodaListComponent);
      this.listRef.instance.setOptions(this.listOptions);
    }, 100);
  }

  reloadTable() {
    if (this.listRef && this.listRef.instance) {
      this.listRef.instance.reloadTable();
    }
  }

  initForm() {
    this.options = {
      title: '테스트 폼',
      fields: [
        {
          title: '담당자 선택',
          name: '',
          type: 'subtitle',
        },
        {
          type: 'template',
          template: this.testTempRef,
        },
        {
          type: 'row',
          columns: [
            {
              title: '담당자',
              name: 'staff.[0]',
              type: 'typeahead',
              onTypeahead: (text$: Observable<string>) =>
                text$.pipe(
                  debounceTime(200),
                  distinctUntilChanged(),
                  map(term => term.length < 2 ? []
                    : testStates.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
                ),
              required: true,
              appendButton: {
                title: 'Add',
                color: 'primary',
                onClick: () => {
                  this.ref.instance.setFocus('staff.[3]');
                }
              }
            },
            {
              title: '담당일자',
              name: 'staff.[1]',
              value: new Date('2013-03-01'),
              type: 'date',
              required: true,
            },
            {
              title: '<i class="far fa-plus"></i> 추가',
              name: 'addButton',
              type: 'button',
              color: 'primary',
              onClick: () => { }
            },
          ]
        },
        {
          type: 'template',
          template: this.imgsTempRef,
        },
        {
          type: 'file-multiple',
          name: 'imgName',
          title: 'Image URL',
          onValueChanged: (value: FileList) => {
            if (value && value.length > 0) {
              for (let i = 0; i < value.length; i++) {
                const val = value[i];
                const reader = new FileReader();
                reader.readAsDataURL(val);
                reader.onload = () => {
                  this.imgSrcs.push(reader.result);
                };
              }
            }
          }
        },
        {
          title: '담당금액',
          name: 'staff.[3]',
          type: 'decimal',
          placeholder: '숫자입력',
          required: true,
          onValueChanged: (value: number) => {
            this.num = value;
            this.ref.instance.refreshState();
          },
          appendButton: {
            title: '<i class="fas fa-trash"></i>',
            color: 'danger',
            onState: _ => this.num > 100000 ? 'enabled' : 'hide',
            onClick: () => { }
          }
        },
        {
          title: '<i class="far fa-plus"></i> 추가',
          name: 'addButton',
          type: 'button',
          color: 'success',
          onClick: () => { },
          onState: _ => this.num > 100000 ? 'enabled' : 'disabled'
        },

        {
          title: '비고',
          name: 'staff.[4]',
          type: 'text',
          value: 'test',
        },
        {
          title: 'Select 테스트',
          name: '',
          type: 'subtitle',
        },
        {
          type: 'row',
          columns: [
            {
              title: '사유(5글자이상)',
              name: 'staff.[5]',
              type: 'text',
              required: true,
              validators: [Validators.minLength(5)],
              width: 'col-5'
            },
            {
              title: '입고예정일',
              'name': 'staff.[2]',
              value: new Date('2019-01-01'),
              type: 'date',
              width: 'col-5',
            },
            {
              title: 'test select',
              name: 'staff.[6]',
              type: 'select',
              value: '3',
              asyncOptions: this.optionTestSubject,
            }
          ]
        },

      ],
      onAction: (action: string, data: any) => {
        console.log(data);
        this.ref.destroy();
        this.ref = null;
      }
    };
    console.log('form inited');
    setTimeout(() => {
      console.log('add form component');
      this.ref = this.yodaFloatService.addComponent(YodaFormComponent);
      this.ref.instance.setOptions(this.options);
    }, 100);

    setTimeout(() => {
      this.optionTestSubject.next([
        {
          value: '0',
          text: 'zero'
        },
        {
          value: '1',
          text: 'one'
        },
        {
          value: '2',
          text: 'two'
        },
        {
          value: '3',
          text: 'three'
        },
        {
          value: '4',
          text: 'four'
        },
        {
          value: '5',
          text: 'five'
        },
      ]);
    }, 5000);

    setTimeout(() => {
      this.optionTestSubject.next([
        {
          value: '0',
          text: 'zero 0'
        },
        {
          value: '1',
          text: 'one 1'
        },
        {
          value: '2',
          text: 'two 2'
        },
        {
          value: '3',
          text: 'three 3'
        },
        {
          value: '4',
          text: 'four 4'
        },
        {
          value: '5',
          text: 'five 5'
        },
      ]);
    }, 8000);


  }

}
