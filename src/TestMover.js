import React, { Component } from 'react'

export default class TestMover extends Component {
    constructor(props) {
        super(props)

        this.state = { 
            position: this.props.startPosition
        }
        this.ref = React.createRef()
    }

    componentDidMount() {
        const current = this.ref.current.style.transform.split('').filter(n => (/[0-9]/.test(n))).join('').substr(0,2)
        setTimeout(() => this.setState(() => ({ position: (current + this.props.inc) % 1000})), 1000) 
    }

    componentDidUpdate() {
        setTimeout(() => this.setState(() => ({ position: (this.state.position + this.props.inc) % 1000 })), 1000) 
    }

    render() {
        return(
            <div
                ref={this.ref}
                style={{
                    width: 20,
                    height: 20,
                    transform: `translate(${this.state.position}px, 0px)`,
                    transition: 'transform 1s linear',
                    willChange: 'transform',
                    background: 'coral',
                    top: 500
                }}
            ></div>
        )
    }
}