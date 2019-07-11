import { Component, Inject } from '@angular/core';
import axios from 'axios'
import * as CryptoJS from 'crypto-js';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_SNACK_BAR_DATA } from '@angular/material';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})

export class AppComponent {

  lyra = "";
  password = "";
  results = {}
  results_to_send = []
  poll: any
  total: number = 0
  progress: boolean = false
  durationInSeconds = 5;

  constructor(public dialog: MatDialog, private _snackBar: MatSnackBar) {
  }


  openSnackBar(data: string) {
    this._snackBar.openFromComponent(SnackComponent, {
      data: data,
      duration: this.durationInSeconds * 1000,
    });
  }

  async getResults(event) {
    this.progress = true
    this.results = {}
    this.results_to_send = []
    this.total = 0
    if (this.lyra !== "" && this.password !== "") {
      await this.ReceivedVoteCardsFromAPI(this.lyra).then(__received => {
        var txs: any = __received
        for (var i = 0; i < txs.length; i++) {
          var tx = txs[i]
          var exp = tx.data.split(':')
          if (exp[0] === 'poll' && exp[1] === '//VOTE') {
            if (exp[2] !== 'null') {
              if (this.password !== '') {
                try {
                  var lr = (this.decrypt(exp[2], this.password))
                } catch{ }
                if (!isNaN(Number(lr))) {
                  if (this.results.hasOwnProperty(lr)) {
                    this.results[lr] = this.results[lr] + 1
                    this.total = this.total + 1
                  } else {
                    this.results[lr] = 1
                    this.total = this.total + 1
                  }
                }
              }
            }
          }
        }
        return this.results

      }).then(async x => {

        await this.ReadPollFromAPI(this.lyra).then(res => {
          Object.keys(res).forEach(k => {
            if (res[k]['data'].hasOwnProperty('name')) {
              this.poll = res[k]['data']
            }
          })
        }).catch(ex => this.progress = false).then(r => {
          try{
            Object.keys(this.results).forEach(el => {
              var local = { 'k': [this.poll['answers'][el]['value']], 'v': [this.results[el] * 100 / this.total], 'd': this.results[el] }
              this.results_to_send.push(local)
            })
          }catch{
            this.openSnackBar("Wrong Lyra Address or Password!")
            this._snackBar.dismiss()
          }
          
        })
        if (x !== undefined && Object.keys(x).length > 0) {
          this.openDialog()
        } else {
          this.openSnackBar("Wrong Lyra Address or Password!")
        }
      })
    }
    else {
      this.openSnackBar("Completa tutti i campi e verifica che l'indirizzo e la password siano corretti!")
    }
    this.progress = false
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverview, {
      minWidth: '400px',
      data: { poll: this.poll, results: this.results_to_send }
    });

  }

  ReceivedVoteCardsFromAPI(address) {
    return new Promise((resolve, reject) => {
      axios.post('https://idanode01.scryptachain.org/received', {
        address: address
      })
        .then((resp) => {
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })

  }

  ReadPollFromAPI(address) {
    return new Promise((resolve, reject) => {
      axios.post('https://idanode01.scryptachain.org/read', {
        address: address,
        json: true,
        history: false,
        decrypt: false,
        protocol: 'poll://'

      })
        .then((resp) => {
          resolve(resp.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })

  }
  decrypt(transitmessage, pass) {

    var keySize = 128;
    var iterations = 10;
    var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
    var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
    var encrypted = transitmessage.substring(64);

    var key = CryptoJS.HmacSHA1(pass, salt, {
      keySize: keySize / 16,
      iterations: iterations,
    });

    var decrypted = CryptoJS.RC4.decrypt(encrypted, key, {
      iv: iv,
      padding: CryptoJS.pad.AnsiX923,
      mode: CryptoJS.mode.CBC

    })
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

@Component({
  selector: 'snack-bar',
  template: `
  <span class="snack">
  {{data}}
  </span> 
  `,
  styles: [`
    .snack {
      color: hotpink;
    }
  `],
})
export class SnackComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
  }
}

export interface DialogData {
  poll: any;
  results: any;
}
@Component({
  selector: 'dialog-overview',
  templateUrl: './dialog.html',
})
export class DialogOverview {

  constructor(
    public dialogRef: MatDialogRef<DialogOverview>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}