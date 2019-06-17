import { Component, OnInit } from '@angular/core';
import axios from 'axios'
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: []
})

export class AppComponent implements OnInit {

  lyra = "";
  password = "";
  results = {}

  constructor() {
  }

  ngOnInit() {

  }

  getResults(event) {
    this.results = {}
    if (this.lyra !== "" && this.password !== "") {
      this.ReceivedVoteCardFromAPI(this.lyra).then(__received => {
        var txs: any = __received
        for (var i = 0; i < txs.length; i++) {
          var tx = txs[i]
          var exp = tx.data.split(':')
          if (exp[0] === 'poll' && exp[1] === '//VOTE') {
            if (exp[2] !== 'null') {
              if (this.password !== '') {
                try {
                  var lr = (this.decrypt(exp[2], this.password))

                } catch{
                  
                }

                if (!isNaN(Number(lr))) {
                  if (this.results.hasOwnProperty(lr)) {
                    this.results[lr] = this.results[lr] + 1
                  } else {
                    this.results[lr] = 1
                  }
                }
              }
            }
          }
        }
        return this.results

      }).then(x => {
        console.log(x)
        if (x !== undefined && Object.keys(x).length > 0) {
          alert(JSON.stringify(this.results))
        } else {
          alert('Wrong Lyra Address or Password')
        }

      })

    }
    else {
      alert("Completa tutti i campi e verifica che l'indirizzo e la password siano corretti!")
    }
  }

  ReceivedVoteCardFromAPI(address) {
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
