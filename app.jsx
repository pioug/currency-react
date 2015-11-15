import React from 'react';
import ReactDOM from 'react-dom';
import styles from './style.scss';

const endPoint = 'https://currency.piou.io/api/v1/',
  rates = new Map();

class CurrencyInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { rate: 0 };
  }
  recalc(e) {
    this.props.changeBase(e.target.value, this.props.to);
  }
  showMenu(e) {
    let self = this;

    function hideMenu() {
      self.setState({ dropdown: false });
      document.body.removeEventListener('click', hideMenu);
    }

    this.setState({ dropdown: true });
    document.body.addEventListener('click', hideMenu);
  }
  moveUp() {
    this.props.moveUp(this.props.to);
  }
  moveDown() {
    this.props.moveDown(this.props.to);
  }
  remove() {
    this.props.remove(this.props.to);
  }
  updateValue(props) {
    let key = props.from + props.to;

    if (rates.has(key)) {
      this.setState({ rate: rates.get(key) });
    } else {
      rates.set(key, 0); // Not fetch on next call
      fetch(endPoint + ['rate', props.from, props.to].join('/'))
        .then(response => response.json())
        .then(data => {
          rates.set(key, data.rate);
          this.setState({ rate: data.rate })
        });
    }
  }
  componentWillReceiveProps(nextProps) {
    this.updateValue(nextProps);
  }
  componentWillMount() {
    this.updateValue(this.props);
  }

  getBoundingClientRect() {
    return this.refs.fieldset.getBoundingClientRect();
  }

  mousedown() {
    this.props.startMove(this.props.to);
  }

  render() {
    let value,
      klass;

    if (!this.props.convert) {
      value = '';
    } else if (this.props.from !== this.props.to) {
      value = parseFloat(this.props.convert);
      value *= this.state.rate;
      value = value.toFixed(4);
    } else {
      value = this.props.convert;
    }

    klass = 'currency-more';

    if (this.state.dropdown) {
      klass += ' active';
    }

    return (
      <fieldset ref='fieldset'>
        <input type='tel' className='currency-input' value={value} onChange={this.recalc.bind(this)} />
        <label onMouseDown={this.mousedown.bind(this)} onTouchStart={this.mousedown.bind(this)}>{this.props.to}</label>
        <div className={klass} ref='dropdown'>
          <a className='currency-more-open' onClick={this.showMenu.bind(this)}>&middot;</a>
          <div className='currency-more-menu'>
            <div className='currency-more-menu-item' onClick={this.moveUp.bind(this)}>Move up</div>
            <div className='currency-more-menu-item' onClick={this.moveDown.bind(this)}>Move down</div>
            <div className='currency-more-menu-item' onClick={this.remove.bind(this)}>Remove</div>
          </div>
        </div>
      </fieldset>
    );
  }
}

CurrencyInput.propTypes = {
  recalc: React.PropTypes.func,
  from: React.PropTypes.string.isRequired,
  to: React.PropTypes.string.isRequired,
  rate: React.PropTypes.number
};

class Currencies extends React.Component {
  constructor() {
    super();
    this.state = {
      convert: '1.0000',
      currencies: [],
      addedCurrencies: ['EUR', 'SGD', 'USD'],
      from: 'EUR'
    };

    try {
      let prevState = JSON.parse(localStorage.getItem('state'));
      Object.assign(this.state, prevState);
    } catch(e) {
      console.error(e);
    }

    fetch(endPoint + 'currencies')
      .then(response => response.json())
      .then(data => {
        this.setState({ currencies: data });
      });
  }
  componentDidUpdate() {
    localStorage.setItem('state', JSON.stringify(this.state));
  }
  changeBase(convert, from) {
    this.setState({
      convert: convert,
      from: from
    });
  }
  onNewCurrency(currency) {
    this.setState({
      addedCurrencies: this.state.addedCurrencies.concat(currency)
    });
  }
  moveUp(currency) {
    let addedCurrencies = this.state.addedCurrencies.slice(),
      index = addedCurrencies.indexOf(currency);
    addedCurrencies.splice(index, 1);
    addedCurrencies.splice(Math.max(index - 1, 0), 0, currency);
    this.setState({
      addedCurrencies: addedCurrencies
    });
  }
  moveDown(currency) {
    let addedCurrencies = this.state.addedCurrencies.slice(),
      index = addedCurrencies.indexOf(currency);
    addedCurrencies.splice(index, 1);
    addedCurrencies.splice(index + 1, 0, currency);
    this.setState({
      addedCurrencies: addedCurrencies
    });
  }
  remove(currency) {
    let addedCurrencies = this.state.addedCurrencies.slice(),
      index = addedCurrencies.indexOf(currency);
    addedCurrencies.splice(index, 1);
    this.setState({
      addedCurrencies: addedCurrencies
    });
  }

  startMove(currency) {
    const mousemoveFn = mousemove.bind(this),
      mouseupFn = mouseup.bind(this),
      touchmoveFn = touchmove.bind(this),
      self = this;

    document.body.classList.add('moving');
    document.addEventListener('mousemove', mousemoveFn);
    document.addEventListener('touchmove', touchmoveFn);
    document.addEventListener('mouseup', mouseupFn);
    document.addEventListener('touchend', mouseupFn);

    function touchmove(event) {
      locate(event.touches[0].pageX, event.touches[0].pageY);
    }

    function mousemove(event) {
      locate(event.x, event.y);
    }

    function mouseup() {
      document.body.classList.remove('moving');
      document.removeEventListener('mousemove', mousemoveFn);
      document.removeEventListener('mouseup', mouseupFn);
      document.removeEventListener('touchmove', touchmoveFn);
      document.removeEventListener('touchend', mouseupFn);
    }

    function locate(x, y) {
      let rects = Object.keys(self.refs).map((value, index) => {
          let rect = self.refs[value].getBoundingClientRect();
          rect.currency = value;
          return rect;
        }),
        location = rects.find((rect) => {
          return rect.top <= y && rect.bottom >= y;
        });

      if (!location && rects[0].bottom >= y) {
        move(currency, 'top');
      } else if (!location && rects[rects.length - 1].top <= y) {
        move(currency, 'bottom');
      } else if (location  && location.currency !== currency) {
        move(currency, location.currency);
      }
    }

    function move(source, dest, below) {
      let currencies = self.state.addedCurrencies.slice(),
        index = currencies.indexOf(source),
        newIndex;

      if (dest === 'top') {
        newIndex = 0;
      } else if (dest === 'bottom') {
        newIndex = currencies.length;
      } else if (dest) {
        newIndex = currencies.indexOf(dest);
      }

      currencies.splice(index, 1);
      currencies.splice(newIndex, 0, source);
      self.setState({ addedCurrencies: currencies });
    }
  }

  render() {
    let list = this.state.addedCurrencies.map(currency =>
      <CurrencyInput
        ref={currency}
        key={currency}
        convert={this.state.convert}
        from={this.state.from}
        to={currency}
        changeBase={this.changeBase.bind(this)}
        remove={this.remove.bind(this)}
        moveDown={this.moveDown.bind(this)}
        moveUp={this.moveUp.bind(this)}
        startMove={this.startMove.bind(this)} />
    );
    return (
      <div>
        <section>{list}</section>
        <NewCurrencyInput addedCurrencies={this.state.currencies} onNewCurrency={this.onNewCurrency.bind(this)} currencies={this.state.currencies} />
      </div>
    );
  }
}

class NewCurrencyInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
  }
  filterList(e) {
    this.setState({ value: e.target.value });
  }
  addCurrency(currency, e) {
    this.props.onNewCurrency(currency.code);
    this.refs.input.value = '';
    this.setState({ value: '' });
  }
  addCurrencyFromSelect(e) {
    this.props.onNewCurrency(this.refs.select.value);
    this.refs.select.value = 'none';
    this.setState({ value: '' });
  }
  render() {
    let list = this.props.currencies
      .filter(currency => {
        let regex = new RegExp(this.state.value, 'i');
        return currency.code.search(regex) > -1 || currency.name.search(regex) > -1;
      })
      .map(currency => {
        let klass = this.props.addedCurrencies.indexOf(currency.code) > -1 ? 'active' : '';
        klass += ' new-currency-list-item'
        return (
          <div key={currency.code} className={klass} onClick={this.addCurrency.bind(this, currency)}>
            <span className='new-currency-list-item-code'>{currency.code}</span>
            <span className='new-currency-list-item-name'>{currency.name}</span>
          </div>
        );
      });
    let listOpts = this.props.currencies
      .sort(function(a, b) {
        if(a.code < b.code) return -1;
        if(a.code > b.code) return 1;
        return 0;
      })
      .map(currency => {
        return (
          <option key={currency.code} value={currency.code}>{currency.code} {currency.name}</option>
        )
      })
    return (
      <section className='new-currency'>
        <input className='new-currency-input' type='text' placeholder='add a currency' ref='input' onChange={this.filterList.bind(this)}/>
        <div className='new-currency-list'>{list}</div>
        <select className='new-currency-select' ref='select' onChange={this.addCurrencyFromSelect.bind(this)} defaultValue='none'>
          <option value='none' disabled>add a currency</option>
          {listOpts}
        </select>
      </section>
    );
  }
}

NewCurrencyInput.propTypes = {
  currencies: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
  onNewCurrency: React.PropTypes.func
};

ReactDOM.render(<Currencies />, document.getElementById('app'));
