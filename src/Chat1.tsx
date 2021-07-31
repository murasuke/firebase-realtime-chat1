import React, {useState, useMemo, useEffect} from 'react';
import db from './firebaseConfig';
import './chat1.css';

type Log = {
  key: string,
  name: string,
  msg: string,
  date: Date,
}


/**
 * ユーザー名 (localStrageに保存)
 **/
const getUName = (): string =>  {
  const userName = localStorage.getItem('firebase-Chat1-username');
  if (!userName) {
    const inputName = window.prompt('ユーザー名を入力してください', '');
    if (inputName){
      localStorage.setItem('firebase-Chat1-username', inputName);
      return inputName;
    }    
  }
  return userName;
}

/**
 * UNIX TIME => hh:mm
 **/
function getStrTime(time: any){
  let t = new Date(time);
  return `${t.getHours()}`.padStart(2, '0') + ':' + `${t.getMinutes()}`.padStart(2, '0');
}


/**
 * チャットコンポーネント(Line風)
 */
const Chat1: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [msg, setMsg] = useState('');
  const userName = useMemo(() => getUName(), []);
  const messagesRef = useMemo(() => db.collection("chatroom").doc("room1").collection("messages"), []);

  useEffect( () => {
    // 同期処理イベント（最新10件をとるためdateでソート)
    messagesRef.orderBy("date", "desc").limit(10).onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          // 追加
          addLog(change.doc.id, change.doc.data());
          window.scroll(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  
  /**
   * チャットログに追加
   */
  function addLog(id: string, data: any) {
    const log = {
      key: id,
      ...data,
    };
    // 時間順に並べるためsort
    setLogs((prev) => [ ...prev, log,].sort( (a,b) => a.date.valueOf() - b.date.valueOf()));
  }

  /**
   * メッセージ送信
   */
  const submitMsg = async () => {
    if (msg.length === 0) {
      return;
    }

    messagesRef.add({
      name: userName,
      msg: msg,
      date: new Date().getTime(),
    });

    setMsg("");
  };

  return (
    <>
      <div>      
        {logs.map((item, i) => (
          <div className={userName===item.name? 'balloon_r': 'balloon_l'} key={item.key}>
            {userName===item.name? getStrTime(item.date): '' }
            <div className="faceicon">
              <img src={userName===item.name? './img/cat.png': './img/dog.png'} alt="" />
            </div>
            <div style={{marginLeft: '3px'}}>
              {item.name}<p className="says">{item.msg}</p>
            </div>
            {userName===item.name? '': getStrTime(item.date)}
          </div>
        ))}
      </div>

      <form className='chatform' onSubmit={e => { submitMsg();e.preventDefault() }}>
        <div>{userName}</div>       
          <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <input type='image' onClick={submitMsg} src='./img/airplane.png' alt='' />       
      </form>
    </>
  );
};

export default Chat1;
