---
title: test00000000
date: 2019-01-13 10:44:48
tags:
---

This is a test article!

## JS

```javascript
$.fn.calendar = function(opts) {
    var _this = this;

    return this.click(function(e) {
        e.stopPropagation();
        var index = _this.index($(this)) + 1,
            this_calendar = $(this).data('calendar');

        if (this_calendar) {
            var cal_ele = this_calendar.calendar,
                date = new Date();
            $('.calendar-box').not(cal_ele).hide();
            if (cal_ele.css('display') == 'none') {
                this_calendar.reSet(date.getMonth(), date.getFullYear(), 1);
                cal_ele.show()
            } else {
                cal_ele.hide()
            }
        } else {
            $('.calendar-box').hide()
            $(document).click(function() {
                $('.calendar-box').hide()
            });
            var cal_obj = new Calendar(index, $(this), opts);
            $(this).data('calendar', cal_obj);
        }

    })
}
```

```jsx
function Counter(props){
    return <div>{this.props.name}</div>
}

class Counter {
    constructor(props){
        super(props);

        this.state = {
            activeSuggestion: null,
            inputValue: '',
            results: [],
            showSuggestions: false,
            isMinimized: false,
            isMinimizing: false,
            selectedSpirit: '',
            placeholderText: this.props.intl.formatMessage({ id: 'copy.selectHotelPlaceholder' }),
            placeholderIndex: 0,
            placeholderAnimatorActive: false,
            unresolvedPropertiesFetch: 0,
            canUpdateSuggestionsVisibility: true,
        };

        this.getProperties = this.getProperties.bind(this);
        this.updateInputValue = this.updateInputValue.bind(this);
        this.renderListItem = this.renderListItem.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    onClick(){
        const { number } = this.state;
        this.setState({ number });
    }

    return (
        <div className={`map-search b-layer-popover${(isMinimized) ? ' minimized' : ''}${(isMinimizing) ? ' minimizing' : ''}${(this.props.panelIsOpen) ? ' panel-is-open' : ''}`} data-module="map-search">
            <i
                className="map-search-close-button b-icon b-icon-close-bold"
                onClick={() => this.minimizeMe()}
                data-locator="close-button"
            ></i>
            <div className="map-search-heading b-mb2 b-mb3@md b-text_display-1" data-locator="heading">{this.props.intl.formatMessage({ id: 'heading.whereCanHyattTakeYou' })}</div>
            <label className="b-form-input input-text map-search-input-label">
                <span className="map-search-span b-form-input_has-icon">
                    <input
                        className="b-form-input__control map-search-input"
                        id="searchbox"
                        data-js="map-search-in"
                        data-js-validation-input-facade="tHotel"
                        data-locator="search-input"
                        type="text"
                        placeholder={this.state.placeholderText}
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-owns="suggestions-list"
                        aria-haspopup="list"
                        aria-activedescendant=""
                        aria-describedby="initInstr"
                        aria-required="true"
                        value={this.state.inputValue}
                        onChange={(evt) => updateInputValue(evt)}
                        onKeyDown={(evt) => onKeyDown(evt)}
                    />
                    <span className="b-form-input__icon search-icon" data-locator="search-icon"><i className="b-icon b-icon-search"></i></span>
                </span>
                <div className={`map-search-menu ${(this.state.showSuggestions) ? '' : 'b-d-none'}`}
                    id="suggestion-list"
                    data-js="map-search-out"
                    aria-label="Search Results"
                    data-locator="suggestions-list-container"
                    role="listbox">
                    {suggestionsListComponent}
                </div>
            </label>
            <button {...buttonAttributes} data-locator="search-button">
                {this.props.intl.formatMessage({ id: 'button.search' })}
            </button>
            <div id="announce" className="b-sr-only"
                aria-live="assertive">
            </div>
            <span id="initInstr" className="b-d-none">Type to search. Use up or down arrows to scroll through items, and Tab or Enter to select.</span>
            <div id="announce-none-found" className="b-d-none">
                No matches found. Please modify your search.
            </div>
            <div id="announce-num-found" className="b-d-none">
                0 matches found!
            </div>
            <div id="announce-one-found" className="b-d-none">
                1 match found!
            </div>
        </div>
    );
}
```

## HTML

```html
<div class="hexo">html</div>
```

## CSS

```css
#container {
    display:flex;
    position:absolute;
}

#container h2{
    display:flex;
    position:absolute;
}

ul li{
    display:flex;
    position:absolute;
}

ul li.list-item{
    display:flex;
    position:absolute;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
    background: #1e2127;
}

/* Inline code */
:not(pre) > code[class*="language-"] {
    padding: .1em;
    border-radius: .3em;
    white-space: normal;
}

.token.comment,
.token.prolog,
.token.doctype,
.token.cdata {
    color: slategray;
}
```
