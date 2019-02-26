import React, { Component } from 'react'

export default class TestMover extends Component {
    constructor(props) {
        super(props)

        this.state = { position: this.props.startPosition }
    }

    componentDidMount() {
        window.requestAnimationFrame(() => this.setState(() => ({ position: (this.state.position + 1) % 500}))) 
    }

    componentDidUpdate() {
        window.requestAnimationFrame(() => this.setState(() => ({ position: (this.state.position + 1) % 500 }))) 
    }

    render() {
        return(
            <div
                style={{
                    width: 5,
                    height: 5,
                    transform: `translate(${this.state.position}px, 0px)`,
                    willChange: 'transform',
                    background: 'coral',
                    top: 500
                }}
            ></div>
        )
    }
}